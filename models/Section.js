const mongoose = require("mongoose");

const sectionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ['featured', 'latest', 'category', 'custom'],
      default: 'latest'
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: function() {
        return this.type === 'category';
      }
    },
    limit: {
      type: Number,
      default: 6,
      min: 1,
      max: 20
    },
    order: {
      type: Number,
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    },
    displayStyle: {
      type: String,
      enum: ['grid', 'list', 'carousel'],
      default: 'grid'
    },
    customQuery: {
      type: Object,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Add index for ordering
sectionSchema.index({ order: 1 });

module.exports = mongoose.model("Section", sectionSchema); 