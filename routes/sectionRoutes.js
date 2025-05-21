const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const Blog = require("../models/Blog");
const { verifyToken, isAdmin } = require("../middleware/auth");

// Get all sections with their blogs
router.get("/", async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true })
      .populate("category", "name slug")
      .sort({ order: 1 });

    // Fetch blogs for each section
    const sectionsWithBlogs = await Promise.all(
      sections.map(async (section) => {
        let query = { status: "published" };
        
        switch (section.type) {
          case "featured":
            query.featured = true;
            break;
          case "category":
            query.category = section.category._id;
            break;
          case "custom":
            query = { ...query, ...section.customQuery };
            break;
          // 'latest' is default, no additional query needed
        }

        const blogs = await Blog.find(query)
          .populate("author", "name")
          .populate("category", "name slug")
          .sort({ createdAt: -1 })
          .limit(section.limit);

        return {
          ...section.toObject(),
          blogs
        };
      })
    );

    res.json(sectionsWithBlogs);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Error fetching sections" });
  }
});

// Create a new section (Admin only)
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      limit,
      order,
      displayStyle,
      customQuery
    } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        message: "Missing required fields",
        details: {
          title: !title ? "Title is required" : null,
          type: !type ? "Type is required" : null
        }
      });
    }

    // Validate category if type is 'category'
    if (type === "category" && !category) {
      return res.status(400).json({
        message: "Category is required for category type sections"
      });
    }

    const section = new Section({
      title,
      description,
      type,
      category: type === "category" ? category : undefined,
      limit: limit || 6,
      order: order || 0,
      displayStyle: displayStyle || "grid",
      customQuery: type === "custom" ? customQuery : {}
    });

    await section.save();
    res.status(201).json(section);
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ message: "Error creating section" });
  }
});

// Update a section (Admin only)
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      limit,
      order,
      isActive,
      displayStyle,
      customQuery
    } = req.body;

    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Update fields
    section.title = title || section.title;
    section.description = description || section.description;
    section.type = type || section.type;
    section.category = type === "category" ? category : undefined;
    section.limit = limit || section.limit;
    section.order = order !== undefined ? order : section.order;
    section.isActive = isActive !== undefined ? isActive : section.isActive;
    section.displayStyle = displayStyle || section.displayStyle;
    section.customQuery = type === "custom" ? customQuery : section.customQuery;

    await section.save();
    res.json(section);
  } catch (error) {
    console.error("Error updating section:", error);
    res.status(500).json({ message: "Error updating section" });
  }
});

// Delete a section (Admin only)
router.delete("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    await section.deleteOne();
    res.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Error deleting section:", error);
    res.status(500).json({ message: "Error deleting section" });
  }
});

// Toggle section active status (Admin only)
router.patch("/:id/toggle", verifyToken, isAdmin, async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    section.isActive = !section.isActive;
    await section.save();

    res.json({
      message: `Section ${section.isActive ? "activated" : "deactivated"} successfully`,
      section
    });
  } catch (error) {
    console.error("Error toggling section:", error);
    res.status(500).json({ message: "Error toggling section status" });
  }
});

module.exports = router; 