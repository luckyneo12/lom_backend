# Blog Backend API

A robust backend API for a blog system with features like categories, sections, and drag-and-drop ordering.

## Features

- 🔐 Authentication & Authorization
- 📝 Blog Management
- 📂 Category Management with Drag & Drop Ordering
- 📑 Section Management
- 🖼️ Image Upload Support
- 🔍 Search & Filtering
- 📊 Blog Statistics

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Google Cloud Storage (for image uploads)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd new-blogbackend-main
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
GCP_SERVICE_ACCOUNT_KEY=your_gcp_service_account_key
BUCKET_NAME=your_gcp_bucket_name
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Categories

- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get a single category
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category
- `PUT /api/categories/reorder` - Reorder categories (drag & drop)

### Sections

- `GET /api/sections` - Get all sections
- `GET /api/sections/:id` - Get a single section
- `POST /api/sections` - Create a new section
- `PUT /api/sections/:id` - Update a section
- `DELETE /api/sections/:id` - Delete a section
- `PUT /api/sections/reorder` - Reorder sections (drag & drop)

### Blogs

- `GET /api/blogs` - Get all blogs
- `GET /api/blogs/:id` - Get a single blog
- `POST /api/blogs` - Create a new blog
- `PUT /api/blogs/:id` - Update a blog
- `DELETE /api/blogs/:id` - Delete a blog

## Category Reordering

To reorder categories, send a PUT request to `/api/categories/reorder` with the following body:

```json
{
  "categories": [
    { "id": "category_id_1", "order": 1 },
    { "id": "category_id_2", "order": 2 },
    { "id": "category_id_3", "order": 3 }
  ]
}
```

## Authentication

All admin routes require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

## Error Handling

The API uses a consistent error response format:

```json
{
  "status": "error",
  "message": "Error message",
  "error": {
    "statusCode": 500,
    "status": "error"
  }
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
