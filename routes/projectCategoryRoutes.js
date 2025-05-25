const express = require('express');
const router = express.Router();
const {
  createCategory,
  getAllCategories,
  updateCategory,
  deleteCategory
} = require('../controllers/projectCategoryController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public routes
router.get('/', getAllCategories);

// Protected admin routes
router.post('/', verifyToken, isAdmin, createCategory);
router.put('/:id', verifyToken, isAdmin, updateCategory);
router.delete('/:id', verifyToken, isAdmin, deleteCategory);

module.exports = router; 