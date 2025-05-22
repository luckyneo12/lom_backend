const express = require("express");
const router = express.Router();
const Section = require("../models/Section");
const Blog = require("../models/Blog");
const { verifyToken, isAdmin } = require("../middleware/auth");
const mongoose = require("mongoose");

// Get all sections
router.get("/", async (req, res) => {
  try {
    const sections = await Section.find({ isActive: true })
      .sort({ order: 1 });
    res.json(sections);
  } catch (error) {
    console.error("Error fetching sections:", error);
    res.status(500).json({ message: "Error fetching sections" });
  }
});

// Get a single section by ID
router.get("/:id", async (req, res) => {
  try {
    const section = await Section.findById(req.params.id);
    
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Fetch blogs for this section
    const blogs = await Blog.find({ status: "published" })
      .populate("author", "name")
      .populate("category", "name slug")
      .sort({ createdAt: -1 });

    res.json({
      ...section.toObject(),
      blogs
    });
  } catch (error) {
    console.error("Error fetching section:", error);
    res.status(500).json({ message: "Error fetching section" });
  }
});

// Create a new section (Admin only)
router.post("/", verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, order } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({
        message: "Missing required fields",
        details: {
          title: !title ? "Title is required" : null
        }
      });
    }

    const section = new Section({
      title,
      order: order || 0
    });

    await section.save();
    res.status(201).json(section);
  } catch (error) {
    console.error("Error creating section:", error);
    res.status(500).json({ message: "Error creating section" });
  }
});

// Reorder sections (both POST and PUT methods)
const handleReorder = async (req, res) => {
  try {
    console.log("Received reorder request:", req.body);

    const { sections } = req.body;

    if (!sections || !Array.isArray(sections)) {
      return res.status(400).json({ 
        message: "Please provide an array of sections with their new orders",
        received: req.body
      });
    }

    // Update each section's order
    for (const { id, order } of sections) {
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid section ID",
          invalidId: id
        });
      }

      if (typeof order !== 'number') {
        return res.status(400).json({
          message: "Order must be a number",
          invalidOrder: order
        });
      }

      const section = await Section.findById(id);
      if (!section) {
        return res.status(404).json({
          message: "Section not found",
          sectionId: id
        });
      }

      await Section.findByIdAndUpdate(id, { order });
      console.log(`Updated section ${id} with order ${order}`);
    }

    // Get all updated sections
    const updatedSections = await Section.find()
      .sort({ order: 1 });

    res.json({
      message: "Sections reordered successfully",
      sections: updatedSections
    });
  } catch (error) {
    console.error("Error reordering sections:", error);
    res.status(500).json({ 
      message: "Error reordering sections",
      error: error.message,
      stack: error.stack
    });
  }
};

// Add both POST and PUT routes for reordering
router.post("/reorder", verifyToken, isAdmin, handleReorder);
router.put("/reorder", verifyToken, isAdmin, handleReorder);

// Update a section (Admin only)
router.put("/:id", verifyToken, isAdmin, async (req, res) => {
  try {
    const { title, order, isActive } = req.body;

    const section = await Section.findById(req.params.id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Update fields
    section.title = title || section.title;
    section.order = order !== undefined ? order : section.order;
    section.isActive = isActive !== undefined ? isActive : section.isActive;

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