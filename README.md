# Blog Backend

A fully functional blog backend built with Node.js, Express, and MongoDB, featuring authentication, section management, and image upload capabilities.

## Features

- Admin-only authentication using JWT
- Blog CRUD operations
- Section management with ordering
- Image upload using Cloudinary
- MongoDB database integration
- Input validation
- Error handling

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Cloudinary account

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:

   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/blog
   JWT_SECRET=your_jwt_secret_key_here
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

## API Endpoints

### Authentication

- `POST /api/auth/register`

  - Body:
    ```json
    {
      "name": "Admin User",
      "email": "admin@example.com",
      "password": "your_password"
    }
    ```
  - Returns:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Admin User",
        "email": "admin@example.com",
        "isAdmin": true
      },
      "redirectTo": "/dashboard"
    }
    ```

- `POST /api/auth/login`
  - Body:
    ```json
    {
      "email": "admin@example.com",
      "password": "your_password"
    }
    ```
  - Returns:
    ```json
    {
      "token": "jwt_token",
      "user": {
        "id": "user_id",
        "name": "Admin User",
        "email": "admin@example.com",
        "isAdmin": true
      },
      "redirectTo": "/dashboard"
    }
    ```

### Sections

- `GET /api/sections`
  - Returns: List of all active sections sorted by order
  - Response:
    ```json
    [
      {
        "_id": "section_id",
        "title": "Section Title",
        "order": 1,
        "isActive": true
      }
    ]
    ```

- `GET /api/sections/:id`
  - Returns: Single section with its blogs
  - Response:
    ```json
    {
      "_id": "section_id",
      "title": "Section Title",
      "order": 1,
      "isActive": true,
      "blogs": [
        {
          "_id": "blog_id",
          "title": "Blog Title",
          "description": "Blog Description",
          "author": {
            "name": "Author Name"
          },
          "category": {
            "name": "Category Name",
            "slug": "category-slug"
          }
        }
      ]
    }
    ```

- `POST /api/sections`
  - Headers: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "title": "Section Title",
      "order": 1
    }
    ```
  - Returns: Created section

- `PUT /api/sections/:id`
  - Headers: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "title": "Updated Title",
      "order": 2,
      "isActive": true
    }
    ```
  - Returns: Updated section

- `POST/PUT /api/sections/reorder`
  - Headers: `Authorization: Bearer <token>`
  - Body:
    ```json
    {
      "sections": [
        { "id": "section_id_1", "order": 1 },
        { "id": "section_id_2", "order": 2 }
      ]
    }
    ```
  - Returns: Updated sections list

- `DELETE /api/sections/:id`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

- `PATCH /api/sections/:id/toggle`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Updated section with toggled active status

### Blog Posts

- `GET /api/blog`
  - Returns: List of all blog posts

- `GET /api/blog/:id`
  - Returns: Single blog post

- `GET /api/blog/slug/:slug`
  - Returns: Blog post by slug

- `GET /api/blog/section/:sectionId`
  - Returns: Blogs by section ID with pagination
  - Query Parameters:
    - `page`: Page number (default: 1)
    - `limit`: Items per page (default: 10)
  - Response:
    ```json
    {
      "blogs": [...],
      "pagination": {
        "total": 50,
        "page": 1,
        "pages": 5,
        "limit": 10
      },
      "section": {
        "_id": "section_id",
        "title": "Section Title",
        "order": 1
      }
    }
    ```

- `POST /api/blog`
  - Headers: `Authorization: Bearer <token>`
  - Body: FormData with:
    - title
    - description
    - category
    - section (required)
    - tags (array)
    - meta (object with meta_title and meta_description)
    - mainImage
    - sections (array of objects with title, description)
    - section_images (array of images)
  - Returns: Created blog post

- `PUT /api/blog/:id`
  - Headers: `Authorization: Bearer <token>`
  - Body: FormData with same fields as POST
  - Returns: Updated blog post

- `DELETE /api/blog/:id`
  - Headers: `Authorization: Bearer <token>`
  - Returns: Success message

## Blog Structure

Each blog post contains:

- Title
- Description
- Main image
- Category
- Section (required)
- Tags
- SEO metadata
- Sections (with title, description, and image)
- Author information
- Creation and update timestamps
- Auto-generated slug

## Section Structure

Each section contains:

- Title
- Order (for sorting)
- Active status
- Reference to associated blogs

## Security

- All routes except login and blog listing require authentication
- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Input validation on all routes
- Admin-only access for blog and section management
