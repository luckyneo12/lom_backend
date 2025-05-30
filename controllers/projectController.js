const Project = require('../models/Project');
const ProjectCategory = require('../models/ProjectCategory');
const { bucket } = require('../config/gcp');
const path = require('path');

// Create new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // Validate required fields
    if (!title || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }

    // Check if category exists
    const categoryExists = await ProjectCategory.findById(category);
    if (!categoryExists) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Upload main image
    let mainImageUrl = '';
    if (req.files && req.files.mainImage && req.files.mainImage[0]) {
      const file = req.files.mainImage[0];
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
      const filename = `${timestamp}__${file.originalname}`;
      const filePath = `projects/main/${filename}`;

      const blob = bucket.file(filePath);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          await blob.makePublic();
          resolve();
        });
        blobStream.end(file.buffer);
      });

      mainImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Main image is required'
      });
    }

    // Upload additional images
    let additionalImages = [];
    if (req.files && req.files.additionalImages) {
      const uploadPromises = req.files.additionalImages.map(async (file) => {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        const filename = `${timestamp}__${file.originalname}`;
        const filePath = `projects/additional/${filename}`;

        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', reject);
          blobStream.on('finish', async () => {
            await blob.makePublic();
            resolve();
          });
          blobStream.end(file.buffer);
        });

        return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      });

      additionalImages = await Promise.all(uploadPromises);
    }

    const project = new Project({
      title,
      description,
      category,
      mainImage: mainImageUrl,
      additionalImages
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// Get projects by category
exports.getProjectsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const projects = await Project.find({ category: categoryId })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects by category',
      error: error.message
    });
  }
};

// Update project
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // If category is being updated, verify it exists
    if (category) {
      const categoryExists = await ProjectCategory.findById(category);
      if (!categoryExists) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
    }

    // Handle main image upload if new image is provided
    let mainImageUrl = project.mainImage;
    if (req.files && req.files.mainImage) {
      const file = req.files.mainImage[0];
      const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
      const filename = `${timestamp}__${file.originalname}`;
      const filePath = `projects/main/${filename}`;

      const blob = bucket.file(filePath);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', async () => {
          await blob.makePublic();
          resolve();
        });
        blobStream.end(file.buffer);
      });

      mainImageUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    }

    // Handle additional images upload if new images are provided
    let additionalImages = project.additionalImages;
    if (req.files && req.files.additionalImages) {
      const uploadPromises = req.files.additionalImages.map(async (file) => {
        const timestamp = new Date().toISOString().replace(/[:.-]/g, "");
        const filename = `${timestamp}__${file.originalname}`;
        const filePath = `projects/additional/${filename}`;

        const blob = bucket.file(filePath);
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', reject);
          blobStream.on('finish', async () => {
            await blob.makePublic();
            resolve();
          });
          blobStream.end(file.buffer);
        });

        return `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      });

      const newImages = await Promise.all(uploadPromises);
      additionalImages = [...additionalImages, ...newImages];
    }

    const updatedProject = await Project.findByIdAndUpdate(
      id,
      {
        title: title || project.title,
        description: description || project.description,
        category: category || project.category,
        mainImage: mainImageUrl,
        additionalImages
      },
      { new: true }
    ).populate('category', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// Delete project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Delete images from GCP
    if (project.mainImage) {
      const filePath = project.mainImage.split(`${bucket.name}/`)[1];
      const file = bucket.file(filePath);
      await file.delete().catch(console.error);
    }

    if (project.additionalImages && project.additionalImages.length > 0) {
      const deletePromises = project.additionalImages.map(imageUrl => {
        const filePath = imageUrl.split(`${bucket.name}/`)[1];
        const file = bucket.file(filePath);
        return file.delete().catch(console.error);
      });
      await Promise.all(deletePromises);
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
}; 