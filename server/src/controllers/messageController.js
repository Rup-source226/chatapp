const Message = require('../models/Message');
const User = require('../models/User');
const { cacheGet, cacheSet, cacheDelete } = require('../config/redis');
const { sendMessage, TOPICS } = require('../config/kafka');

// Get or create conversation between two users
const getOrCreateConversation = async (userId1, userId2) => {
  // Create a deterministic conversation ID based on sorted user IDs
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;
  return conversationId;
};

// Send a new message
exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content, messageType = 'text', mediaUrl = '' } = req.body;
    const senderId = req.user.userId;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found',
      });
    }

    // Get or create conversation ID
    const conversationId = await getOrCreateConversation(senderId, receiverId);

    // Create message
    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      conversationId,
      content,
      messageType,
      mediaUrl,
    });

    // Populate sender info
    await message.populate('sender', 'username avatar');
    await message.populate('receiver', 'username avatar');

    // Send to Kafka for processing (notifications, etc.)
    await sendMessage(TOPICS.NEW_MESSAGE, {
      key: conversationId,
      value: {
        messageId: message._id,
        senderId,
        receiverId,
        conversationId,
        content,
        messageType,
        createdAt: message.createdAt,
      },
    });

    // Invalidate cache for conversation
    await cacheDelete(`messages:${conversationId}`);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: {
        message,
      },
    });
  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message',
    });
  }
};

// Get messages for a conversation
exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user.userId;

    // Check cache first
    const cacheKey = `messages:${conversationId}:${page}:${limit}`;
    const cachedMessages = await cacheGet(cacheKey);

    if (cachedMessages) {
      return res.json({
        success: true,
        data: cachedMessages,
        cached: true,
      });
    }

    // Get messages from database
    const result = await Message.getConversationMessages(
      conversationId,
      parseInt(page),
      parseInt(limit)
    );

    // Filter messages where user is either sender or receiver
    const filteredMessages = result.messages.filter(
      msg => 
        msg.sender._id.toString() === userId || 
        msg.receiver._id.toString() === userId
    );

    const responseData = {
      messages: filteredMessages,
      total: result.total,
      page: result.page,
      pages: result.pages,
    };

    // Cache the results (short TTL for messages)
    await cacheSet(cacheKey, responseData, 300); // 5 minutes

    res.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error) {
    console.error('Get Messages Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages',
    });
  }
};

// Get conversation with a specific user
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const conversationId = await getOrCreateConversation(currentUserId, userId);

    const otherUser = await User.findById(userId).select('-password');
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get last message
    const lastMessage = await Message.findOne({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username avatar');

    // Get unread count
    const unreadCount = await Message.countDocuments({
      sender: userId,
      receiver: currentUserId,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        conversationId,
        otherUser: otherUser.getPublicProfile(),
        lastMessage,
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get Conversation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    // Mark messages as read
    const result = await Message.markManyAsRead(conversationId, userId);

    // Send seen status to Kafka
    await sendMessage(TOPICS.SEEN_STATUS, {
      key: conversationId,
      value: {
        conversationId,
        userId,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Messages marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    console.error('Mark as Read Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const count = await Message.getUnreadCount(userId);

    res.json({
      success: true,
      data: {
        unreadCount: count,
      },
    });
  } catch (error) {
    console.error('Get Unread Count Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// Delete a message (soft delete)
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findOne({
      _id: messageId,
      sender: userId,
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not the sender',
      });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.content = 'This message has been deleted';
    await message.save();

    // Invalidate cache
    await cacheDelete(`messages:${message.conversationId}`);

    res.json({
      success: true,
      message: 'Message deleted successfully',
    });
  } catch (error) {
    console.error('Delete Message Error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
