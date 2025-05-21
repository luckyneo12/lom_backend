const express = require("express");
const router = express.Router();
const {
  getBlogsByCategory,
  getBlogCountsByCategory,
  getBlogsByMultipleCategories
} = require("../controllers/blogController");

// Public routes
router.get("/blog/category/:categoryId", getBlogsByCategory);
router.get("/blog/category-counts", getBlogCountsByCategory);
router.post("/blog/categories", getBlogsByMultipleCategories);

module.exports = router; 