const express = require('express');
const router = express.Router();
const { 
  createProject, 
  getAllProjects, 
  getProjectsByCategory, 
  updateProject, 
  deleteProject 
} = require('../controllers/projectController');
const { verifyToken, isAdmin } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/', getAllProjects);
router.get('/category/:categoryId', getProjectsByCategory);

// Protected admin routes
router.post('/', 
  verifyToken, 
  isAdmin, 
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 20 }
  ]),
  createProject
);

router.put('/:id', 
  verifyToken, 
  isAdmin, 
  upload.fields([
    { name: 'mainImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 }
  ]),
  updateProject
);

router.delete('/:id', verifyToken, isAdmin, deleteProject);

module.exports = router; 