# Blog Backend API

A robust backend API for a blog platform built with Node.js, Express, and MongoDB.

## Features

- User authentication and authorization
- Blog post management with draft and publish functionality
- Project portfolio management
- Category management
- Image upload using Cloudinary
- JWT-based authentication
- Role-based access control
- Automatic page refresh after draft save
- Section-based blog organization
- SEO metadata support

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user
- GET `/api/auth/me` - Get current user profile

### Blog Posts
- GET `/api/posts` - Get all blog posts
- POST `/api/posts` - Create a new blog post
- GET `/api/posts/:id` - Get a single blog post
- PUT `/api/posts/:id` - Update a blog post
- DELETE `/api/posts/:id` - Delete a blog post
- GET `/api/posts/slug/:slug` - Get blog post by slug
- GET `/api/posts/category/:slug` - Get posts by category slug
- GET `/api/posts/category/id/:categoryId` - Get posts by category ID

### Projects
- GET `/api/projects` - Get all projects
- POST `/api/projects` - Create a new project
- GET `/api/projects/:id` - Get a single project
- PUT `/api/projects/:id` - Update a project
- DELETE `/api/projects/:id` - Delete a project

### Categories
- GET `/api/categories` - Get all categories
- POST `/api/categories` - Create a new category
- GET `/api/categories/:id` - Get a single category
- PUT `/api/categories/:id` - Update a category
- DELETE `/api/categories/:id` - Delete a category

## Blog Post Features

### Draft System
- Save posts as drafts
- Automatic page refresh after draft save
- Toggle between draft and published states
- Draft posts are only visible to authors and admins

### Section Management
- Organize blog posts into sections
- Order sections for custom display
- Section-specific image uploads
- Section metadata support

### Image Handling
- Main image upload for blog posts
- Multiple section images support
- Automatic Cloudinary integration
- Image optimization and CDN delivery

## Project Structure

```
├── config/
│   ├── cloudinary.js
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── blogController.js
│   ├── categoryController.js
│   └── projectController.js
├── middleware/
│   ├── auth.js
│   └── upload.js
├── models/
│   ├── User.js
│   ├── Blog.js
│   ├── Category.js
│   └── Project.js
├── routes/
│   ├── auth.js
│   ├── blog.js
│   ├── category.js
│   └── project.js
├── .env
├── .gitignore
├── package.json
└── server.js
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
