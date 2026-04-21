const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'audio'],
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: '',
    },
    seen: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient querying
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ receiver: 1, createdAt: -1 });
messageSchema.index({ createdAt: -1 });

messageSchema.virtual('isSeen').get(function () {
  return this.seen;
});

// Method to mark message as read
messageSchema.methods.markAsRead = async function () {
  this.isRead = true;
  this.readAt = new Date();
  return await this.save();
};

// Static method to get conversation messages with pagination
messageSchema.statics.getConversationMessages = async function (
  conversationId,
  page = 1,
  limit = 50
) {
  const skip = (page - 1) * limit;
  
  const messages = await this.find({ 
    conversationId,
    isDeleted: false 
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'username avatar')
    .populate('receiver', 'username avatar');

  const total = await this.countDocuments({ 
    conversationId,
    isDeleted: false 
  });

  return {
    messages: messages.reverse(), // Reverse to get chronological order
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

// Static method to mark multiple messages as read
messageSchema.statics.markManyAsRead = async function (conversationId, userId) {
  return await this.updateMany(
    {
      conversationId,
      receiver: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );
};

// Static method to get unread message count
messageSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    receiver: userId,
    isRead: false,
  });
};

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
