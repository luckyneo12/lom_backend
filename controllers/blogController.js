const Blog = require("../models/Blog");
const Category = require("../models/Category");
const Section = require("../models/Section");
const asyncHandler = require("express-async-handler");
const mongoose = require("mongoose");

// Get blogs by category ID or slug
const getBlogsByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;

  let category;
  
  // Check if the parameter is a valid ObjectId
  if (mongoose.Types.ObjectId.isValid(categoryId)) {
    category = await Category.findById(categoryId);
  } else {
    // If not a valid ObjectId, treat it as a slug
    category = await Category.findOne({ slug: categoryId });
  }

  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }

  // Get blogs for this category
  const blogs = await Blog.find({ 
    category: category._id,
    status: "published"
  })
  .populate("author", "name email")
  .populate("category", "name slug")
  .sort({ createdAt: -1 });

  res.status(200).json({
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    blogs: blogs
  });
});

// Get blog counts for all categories
const getBlogCountsByCategory = asyncHandler(async (req, res) => {
  const categories = await Category.find({ status: "published" });
  
  const categoryCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await Blog.countDocuments({
        category: category._id,
        status: "published"
      });
      
      return {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug
        },
        blogCount: count
      };
    })
  );

  res.status(200).json(categoryCounts);
});

// Get blogs by multiple category IDs
const getBlogsByMultipleCategories = asyncHandler(async (req, res) => {
  const { categoryIds } = req.body;

  if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
    res.status(400);
    throw new Error("Please provide an array of category IDs");
  }

  // Validate all category IDs
  const validCategoryIds = categoryIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validCategoryIds.length === 0) {
    res.status(400);
    throw new Error("No valid category IDs provided");
  }

  // Get blogs for these categories
  const blogs = await Blog.find({ 
    category: { $in: validCategoryIds },
    status: "published"
  })
  .populate("author", "name email")
  .populate("category", "name slug")
  .sort({ createdAt: -1 });

  // Get category details
  const categories = await Category.find({
    _id: { $in: validCategoryIds }
  }).select('_id name slug');

  // Group blogs by category
  const blogsByCategory = categories.map(category => ({
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    blogs: blogs.filter(blog => blog.category._id.toString() === category._id.toString())
  }));

  res.status(200).json(blogsByCategory);
});

// Get blogs by section ID
const getBlogsBySection = asyncHandler(async (req, res) => {
  const { sectionId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    res.status(400);
    throw new Error("Invalid section ID");
  }

  const section = await Section.findById(sectionId);
  if (!section) {
    res.status(404);
    throw new Error("Section not found");
  }

  // Get blogs for this section
  const blogs = await Blog.find({ 
    section: section._id,
    status: "published"
  })
  .populate("author", "name email")
  .populate("category", "name slug")
  .sort({ createdAt: -1 });

  res.status(200).json({
    section: {
      _id: section._id,
      title: section.title,
      order: section.order
    },
    blogs: blogs
  });
});

module.exports = {
  getBlogsByCategory,
  getBlogCountsByCategory,
  getBlogsByMultipleCategories,
  getBlogsBySection
}; 