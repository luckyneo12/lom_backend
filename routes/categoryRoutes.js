const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { verifyToken, isAdmin } = require("../middleware/auth");
const Category = require("../models/Category");
const mongoose = require("mongoose");

// Reorder categories handler
const handleReorder = async (req, res) => {
  try {
    console.log("Received reorder request body:", JSON.stringify(req.body, null, 2));

    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      console.error("Invalid request body:", req.body);
      return res.status(400).json({ 
        message: "Please provide an array of categories with their new orders",
        received: req.body
      });
    }

    // Validate all categories before updating
    const validationPromises = categories.map(async ({ id, order }) => {
      console.log(`Validating category: id=${id}, order=${order}`);
      
      if (!id) {
        throw new Error(`Missing category ID in item: ${JSON.stringify({ id, order })}`);
      }
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error(`Invalid category ID format: ${id}`);
      }
      if (typeof order !== 'number') {
        throw new Error(`Order must be a number, received: ${order}`);
      }
      
      const category = await Category.findById(id);
      if (!category) {
        throw new Error(`Category not found with ID: ${id}`);
      }
      return { id, order, category };
    });

    console.log("Starting validation of categories...");
    const validatedCategories = await Promise.all(validationPromises);
    console.log("Validation completed successfully");

    // Update all categories in a single transaction
    console.log("Starting database transaction...");
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      for (const { id, order } of validatedCategories) {
        console.log(`Updating category ${id} with order ${order}`);
        await Category.findByIdAndUpdate(id, { order }, { session });
      }

      console.log("Committing transaction...");
      await session.commitTransaction();
      session.endSession();
      console.log("Transaction committed successfully");

      // Get all updated categories
      console.log("Fetching updated categories...");
      const updatedCategories = await Category.find()
        .sort({ order: 1 });

      console.log("Sending success response");
      res.json({
        message: "Categories reordered successfully",
        categories: updatedCategories
      });
    } catch (error) {
      console.error("Error during transaction:", error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } catch (error) {
    console.error("Error in handleReorder:", error);
    res.status(500).json({ 
      message: "Error reordering categories",
      error: error.message,
      details: error.stack
    });
  }
};

// Public routes
router.get("/", getCategories);

// Reorder categories route (must be before /:id route)
router.post("/reorder", verifyToken, isAdmin, handleReorder);
router.put("/reorder", verifyToken, isAdmin, handleReorder);

// Protected admin routes
router.post("/", verifyToken, isAdmin, createCategory);
router.put("/:id", verifyToken, isAdmin, updateCategory);
router.delete("/:id", verifyToken, isAdmin, deleteCategory);

// Public routes (must be after /reorder)
router.get("/:id", getCategory);

module.exports = router;
