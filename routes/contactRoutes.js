const express = require('express');
const router = express.Router();
const { submitContact, getAllContacts, deleteContact } = require('../controllers/contactController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Public route - Submit contact form
router.post('/submit', submitContact);

// Protected route - Get all contact submissions (admin only)
router.get('/all', verifyToken, isAdmin, getAllContacts);

// Protected route - Delete contact submission (admin only)
router.delete('/:id', verifyToken, isAdmin, deleteContact);

module.exports = router; 