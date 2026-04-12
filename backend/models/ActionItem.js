const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const actionItemSchema = new mongoose.Schema(
  {
    meetingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'done'],
      default: 'pending',
    },
    riskFlag: {
      type: Boolean,
      default: false,
    },
    comments: [commentSchema],
  },
  { timestamps: true }
);

actionItemSchema.index({ meetingId: 1 });
actionItemSchema.index({ assignee: 1, status: 1 });

module.exports = mongoose.model('ActionItem', actionItemSchema);