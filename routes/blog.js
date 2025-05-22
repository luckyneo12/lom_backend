const express = require("express");
const router = express.Router();
const Blog = require("../models/Blog");
const Category = require("../models/Category");
const Section = require("../models/Section");
const { verifyToken, isAdmin, isAuthorOrAdmin } = require("../middleware/auth");
const { upload, cloudinary } = require("../config/cloudinary");
const mongoose = require("mongoose");

// Create a new blog post
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.fields([
    { name: "mainImage", maxCount: 1 },
    { name: "section_images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const {
        title,
        description,
        tags,
        category,
        featured,
        status,
        sections,
        meta,
        section
      } = req.body;

      // Validate required fields
      if (
        !title ||
        !description ||
        !category ||
        !meta ||
        !section
      ) {
        return res.status(400).json({
          message: "Missing required fields",
          details: {
            title: !title ? "Title is required" : null,
            description: !description ? "Description is required" : null,
            category: !category ? "Category is required" : null,
            meta: !meta ? "Meta information is required" : null,
            section: !section ? "Section is required" : null,
          },
        });
      }

      // Validate meta format
      let parsedMeta;
      try {
        parsedMeta = typeof meta === "string" ? JSON.parse(meta) : meta;
        if (!parsedMeta.meta_title || !parsedMeta.meta_description) {
          return res.status(400).json({
            message: "Invalid meta format",
            details: "Meta must include meta_title and meta_description",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid meta format",
          details: "Meta must be a valid JSON object",
        });
      }

      // Validate category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      // Validate section exists
      const sectionExists = await Section.findById(section);
      if (!sectionExists) {
        return res.status(400).json({ message: "Invalid section ID" });
      }

      // Get main image URL if provided
      const mainImageUrl = req.files?.mainImage?.[0]?.path || "";

      // Validate sections format
      let parsedSections;
      try {
        parsedSections = sections
          ? typeof sections === "string"
            ? JSON.parse(sections)
            : sections
          : [];
        if (!Array.isArray(parsedSections)) {
          return res.status(400).json({
            message: "Invalid sections format",
            details: "Sections must be an array",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid sections format",
          details: "Sections must be a valid JSON array",
        });
      }

      // Process sections with images
      const processedSections = await Promise.all(
        parsedSections.map(async (section, index) => {
          const sectionImage = req.files.section_images?.[index];
          
          // Remove the error throw for missing section images
          let sectionImageUrl = section.section_img; // Default to existing image
          if (sectionImage) {
            sectionImageUrl = sectionImage.path;
          }

          return {
            section_img: sectionImageUrl,
            section_title: section.section_title,
            section_description: section.section_description,
            section_list: section.section_list || [],
            order: index,
          };
        })
      );

      // Validate tags format
      let parsedTags;
      try {
        parsedTags = tags
          ? typeof tags === "string"
            ? JSON.parse(tags)
            : tags
          : [];
        if (!Array.isArray(parsedTags)) {
          return res.status(400).json({
            message: "Invalid tags format",
            details: "Tags must be an array",
          });
        }
      } catch (error) {
        return res.status(400).json({
          message: "Invalid tags format",
          details: "Tags must be a valid JSON array",
        });
      }

      const blog = new Blog({
        title,
        description,
        mainImage: mainImageUrl,
        tags: parsedTags,
        category,
        section,
        featured: featured === "true",
        status: status || "draft",
        sections: processedSections,
        meta: parsedMeta,
        author: req.user._id,
      });

      await blog.save();

      res.status(201).json({
        message: "Blog post created successfully",
        blog,
      });
    } catch (error) {
      console.error("Error creating blog post:", error);
      res.status(500).json({
        message: "Error creating blog post",
        error: error.message,
      });
    }
  }
);

// Get all blog posts with category population
router.get("/", async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate("author", "name email")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Error fetching blog posts" });
  }
});

// Get blog posts by category ID with pagination
router.get("/category/id/:categoryId", async (req, res) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate category ID
    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({
        message: "Invalid category ID format",
        details: "Please provide a valid category ID",
      });
    }

    // Validate category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        details: "The requested category does not exist",
      });
    }

    // Get total count for pagination
    const total = await Blog.countDocuments({
      category: categoryId,
      status: "published",
    });

    const blogs = await Blog.find({
      category: categoryId,
      status: "published",
    })
      .populate("author", "name email")
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs by category:", error);
    res.status(500).json({
      message: "Error fetching blog posts by category",
      details: error.message,
    });
  }
});

// Get blog posts by category slug with pagination
router.get("/category/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate category exists by slug
    const category = await Category.findOne({ slug, status: "published" });
    if (!category) {
      return res.status(404).json({
        message: "Category not found",
        details: "The requested category does not exist",
      });
    }

    // Get total count for pagination
    const total = await Blog.countDocuments({
      category: category._id,
      status: "published",
    });

    const blogs = await Blog.find({
      category: category._id,
      status: "published",
    })
      .populate("author", "name email")
      .populate("category", "name slug description")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      blogs,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      category: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        blogCount: total,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs by category slug:", error);
    res.status(500).json({
      message: "Error fetching blog posts by category",
      details: error.message,
    });
  }
});

// Get blog post by slug with category and author population
router.get("/slug/:slug", async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug })
      .populate("author", "name email")
      .populate("category", "name slug description");

    if (!blog) {
      return res.status(404).json({ 
        message: "Blog post not found",
        details: "The requested blog post does not exist"
      });
    }

    res.json({
      message: "Blog post retrieved successfully",
      blog
    });
  } catch (error) {
    console.error("Error fetching blog by slug:", error);
    res.status(500).json({ 
      message: "Error fetching blog post",
      error: error.message 
    });
  }
});

// Update blog post
router.put(
  "/:id",
  verifyToken,
  isAuthorOrAdmin,
  upload.array("section_images", 10),
  async (req, res) => {
    try {
      const {
        title,
        description,
        tags,
        category, 
        featured,
        status,
        sections,
        meta,
        section
      } = req.body;

      console.log("Received section:", section); // Debug log

      const blog = await Blog.findById(req.params.id);
      if (!blog) {
        return res.status(404).json({ message: "Blog post not found" });
      }

      // Validate category if it's being updated
      if (category) {
        const categoryExists = await Category.findById(category);
        if (!categoryExists) {
          return res.status(400).json({ message: "Invalid category ID" });
        }
      }

      // Validate section if provided
      if (section) {
        const sectionExists = await Section.findById(section);
        if (!sectionExists) {
          return res.status(400).json({ message: "Invalid section ID" });
        }
        // Update the section
        blog.section = section;
      }

      // Process sections with images
      let processedSections = [];
      if (sections) {
        try {
          // Parse sections if it's a string
          const parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
          console.log("Parsed sections:", parsedSections); // Debug log

          if (!Array.isArray(parsedSections)) {
            return res.status(400).json({
              message: "Invalid sections format",
              details: "Sections must be an array"
            });
          }

          // Process each section
          processedSections = await Promise.all(parsedSections.map(async (section, index) => {
            const sectionImage = req.files?.[index];
            console.log(`Processing section ${index}:`, section); // Debug log
            console.log(`Section image for index ${index}:`, sectionImage); // Debug log

            return {
              section_img: sectionImage ? sectionImage.path : (section.section_img || ""),
              section_title: section.section_title || "",
              section_description: section.section_description || "",
              section_list: Array.isArray(section.section_list) ? section.section_list : [],
              order: index
            };
          }));

          console.log("Processed sections:", processedSections); // Debug log
        } catch (error) {
          console.error("Error processing sections:", error);
          return res.status(400).json({
            message: "Invalid sections format",
            details: "Sections must be a valid JSON array"
          });
        }
      } else {
        // If no new sections provided, keep existing sections
        processedSections = blog.sections;
      }

      // Process tags
      let processedTags = blog.tags;
      if (tags) {
        try {
          processedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
          if (!Array.isArray(processedTags)) {
            return res.status(400).json({
              message: "Invalid tags format",
              details: "Tags must be an array"
            });
          }
        } catch (error) {
          return res.status(400).json({
            message: "Invalid tags format",
            details: "Tags must be a valid JSON array"
          });
        }
      }

      // Process meta
      let processedMeta = blog.meta;
      if (meta) {
        try {
          const parsedMeta = typeof meta === 'string' ? JSON.parse(meta) : meta;
          processedMeta = {
            meta_title: parsedMeta.meta_title || blog.meta.meta_title,
            meta_description: parsedMeta.meta_description || blog.meta.meta_description,
            meta_keywords: parsedMeta.meta_keywords || blog.meta.meta_keywords
          };
        } catch (error) {
          return res.status(400).json({
            message: "Invalid meta format",
            details: "Meta must be a valid JSON object"
          });
        }
      }

      // Update blog fields
      blog.title = title || blog.title;
      blog.description = description || blog.description;
      blog.tags = processedTags;
      blog.category = category || blog.category;
      blog.featured = featured === "true";
      blog.status = status || blog.status;
      blog.sections = processedSections;
      blog.meta = processedMeta;

      console.log("Saving blog with section:", blog.section); // Debug log
      await blog.save();
      
      // Fetch the updated blog with populated section
      const updatedBlog = await Blog.findById(blog._id)
        .populate("section")
        .populate("category")
        .populate("author", "name email");

      res.json({
        message: "Blog post updated successfully",
        blog: updatedBlog
      });
    } catch (error) {
      console.error("Error updating blog:", error);
      res.status(500).json({ 
        message: "Error updating blog post",
        error: error.message 
      });
    }
  }
);

// Delete blog post
router.delete("/:id", verifyToken, isAuthorOrAdmin, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    // Delete images from Cloudinary
    const { cloudinary } = require("../config/cloudinary");
    for (const section of blog.sections) {
      if (section.section_img) {
        const publicId = section.section_img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await blog.deleteOne();
    res.json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ message: "Error deleting blog post" });
  }
});

// Update blog post by slug
router.put("/slug/:slug", verifyToken, isAuthorOrAdmin, upload.array("section_images", 10), async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ 
        message: "Blog post not found",
        details: "The requested blog post does not exist"
      });
    }

    const {
      title,
      description,
      tags,
      category,
      featured,
      status,
      sections,
      meta,
      section
    } = req.body;

    // Validate category if it's being updated
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
    }

    // Validate section if provided
    if (section) {
      const sectionExists = await Section.findById(section);
      if (!sectionExists) {
        return res.status(400).json({ message: "Invalid section ID" });
      }
    }

    // Process sections with images
    let processedSections = blog.sections;
    if (sections) {
      try {
        const parsedSections = typeof sections === 'string' ? JSON.parse(sections) : sections;
        processedSections = parsedSections.map((section, index) => {
          const sectionImage = req.files?.[index];
          return {
            section_img: sectionImage
              ? sectionImage.path
              : section.section_img,
            section_title: section.section_title,
            section_description: section.section_description,
            section_list: section.section_list || [],
            order: index,
          };
        });
      } catch (error) {
        return res.status(400).json({
          message: "Invalid sections format",
          details: "Sections must be a valid JSON array"
        });
      }
    }

    // Process tags
    let processedTags = blog.tags;
    if (tags) {
      try {
        processedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        return res.status(400).json({
          message: "Invalid tags format",
          details: "Tags must be a valid JSON array"
        });
      }
    }

    // Process meta
    let processedMeta = blog.meta;
    if (meta) {
      try {
        const parsedMeta = typeof meta === 'string' ? JSON.parse(meta) : meta;
        processedMeta = {
          meta_title: parsedMeta.meta_title || blog.meta.meta_title,
          meta_description: parsedMeta.meta_description || blog.meta.meta_description,
          meta_keywords: parsedMeta.meta_keywords || blog.meta.meta_keywords
        };
      } catch (error) {
        return res.status(400).json({
          message: "Invalid meta format",
          details: "Meta must be a valid JSON object"
        });
      }
    }

    // Update blog fields
    blog.title = title || blog.title;
    blog.description = description || blog.description;
    blog.tags = processedTags;
    blog.category = category || blog.category;
    blog.section = section || blog.section;
    blog.featured = featured === "true";
    blog.status = status || blog.status;
    blog.sections = processedSections;
    blog.meta = processedMeta;

    await blog.save();
    res.json({
      message: "Blog post updated successfully",
      blog
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    res.status(500).json({ 
      message: "Error updating blog post",
      error: error.message 
    });
  }
});

// Delete blog post by slug
router.delete("/slug/:slug", verifyToken, isAuthorOrAdmin, async (req, res) => {
  try {
    const blog = await Blog.findOne({ slug: req.params.slug });
    if (!blog) {
      return res.status(404).json({ 
        message: "Blog post not found",
        details: "The requested blog post does not exist"
      });
    }

    // Delete images from Cloudinary
    if (blog.mainImage) {
      const publicId = blog.mainImage.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(publicId);
    }

    for (const section of blog.sections) {
      if (section.section_img) {
        const publicId = section.section_img.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await blog.deleteOne();
    res.json({ 
      message: "Blog post deleted successfully",
      details: "The blog post and its associated images have been removed"
    });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ 
      message: "Error deleting blog post",
      error: error.message 
    });
  }
});

// Get blogs by section ID
const getBlogsBySection = async (sectionId, page = 1, limit = 10) => {
  try {
    const response = await fetch(`/api/blogs/section/${sectionId}?page=${page}&limit=${limit}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    throw error;
  }
};

module.exports = router;
