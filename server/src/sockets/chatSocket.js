const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const { 
  setUserOnline, 
  setUserOffline, 
  getAllOnlineUsers,
  getUserSocket 
} = require('../config/redis');
const { sendMessage: sendToKafka, TOPICS } = require('../config/kafka');

const initializeSocket = (io) => {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = {
        userId: decoded.userId,
        username: user.username,
      };

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User connected: ${socket.user.username} (${socket.id})`);

    // Set user as online in Redis
    await setUserOnline(socket.user.userId, socket.id);

    // Join user's personal room
    socket.join(`user:${socket.user.userId}`);

    // Broadcast online users to all connected clients
    const onlineUsers = await getAllOnlineUsers();
    io.emit('onlineUsers', Object.keys(onlineUsers));

    // Handle joining a conversation room
    socket.on('join', async (conversationId) => {
      socket.join(`conversation:${conversationId}`);
      console.log(`User ${socket.user.username} joined conversation: ${conversationId}`);
      
      // Notify others in the conversation
      socket.to(`conversation:${conversationId}`).emit('userJoined', {
        userId: socket.user.userId,
        username: socket.user.username,
        conversationId,
      });
    });

    // Handle leaving a conversation room
    socket.on('leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
      console.log(`User ${socket.user.username} left conversation: ${conversationId}`);
      
      socket.to(`conversation:${conversationId}`).emit('userLeft', {
        userId: socket.user.userId,
        username: socket.user.username,
        conversationId,
      });
    });

    // Handle sending messages
    socket.on('message', async (data) => {
      try {
        const { receiverId, content, conversationId, messageType = 'text' } = data;

        // Create message in database
        const message = await Message.create({
          sender: socket.user.userId,
          receiver: receiverId,
          conversationId,
          content,
          messageType,
        });

        // Populate sender info
        await message.populate('sender', 'username avatar');
        await message.populate('receiver', 'username avatar');

        // Send to Kafka for processing
        await sendToKafka(TOPICS.NEW_MESSAGE, {
          key: conversationId,
          value: {
            messageId: message._id,
            senderId: socket.user.userId,
            receiverId,
            conversationId,
            content,
            messageType,
            createdAt: message.createdAt,
          },
        });

        // Emit to sender (confirm message sent)
        socket.emit('message', message);

        // Emit to receiver (if online)
        const receiverSocketId = await getUserSocket(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message', message);
        }

        // Also emit to conversation room
        io.to(`conversation:${conversationId}`).emit('message', message);

        console.log(`Message sent from ${socket.user.username} to ${receiverId}`);
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', async (data) => {
      const { conversationId, receiverId, isTyping } = data;

      // Send to Kafka for typing indicator
      await sendToKafka(TOPICS.TYPING_INDICATOR, {
        key: conversationId,
        value: {
          senderId: socket.user.userId,
          receiverId,
          conversationId,
          isTyping,
          timestamp: Date.now(),
        },
      });

      // Emit to receiver
      const receiverSocketId = await getUserSocket(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('typing', {
          senderId: socket.user.userId,
          senderUsername: socket.user.username,
          conversationId,
          isTyping,
        });
      }

      // Also emit to conversation room
      socket.to(`conversation:${conversationId}`).emit('typing', {
        senderId: socket.user.userId,
        senderUsername: socket.user.username,
        conversationId,
        isTyping,
      });
    });

    // Handle seen status (read receipts)
    socket.on('seen', async (data) => {
      try {
        const { conversationId, messageIds, senderId } = data;

        // Mark messages as read in database
        await Message.updateMany(
          {
            _id: { $in: messageIds },
            receiver: socket.user.userId,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Send to Kafka for seen status
        await sendToKafka(TOPICS.SEEN_STATUS, {
          key: conversationId,
          value: {
            conversationId,
            readerId: socket.user.userId,
            senderId,
            messageIds,
            readAt: new Date(),
          },
        });

        // Emit to sender
        const senderSocketId = await getUserSocket(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('seen', {
            conversationId,
            readerId: socket.user.userId,
            messageIds,
            readAt: new Date(),
          });
        }

        // Also emit to conversation room
        io.to(`conversation:${conversationId}`).emit('seen', {
          conversationId,
          readerId: socket.user.userId,
          messageIds,
          readAt: new Date(),
        });

        console.log(`Messages seen by ${socket.user.username} in conversation ${conversationId}`);
      } catch (error) {
        console.error('Seen status error:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username} (${socket.id})`);

      // Set user as offline in Redis
      await setUserOffline(socket.user.userId);

      // Broadcast updated online users
      const onlineUsers = await getAllOnlineUsers();
      io.emit('onlineUsers', Object.keys(onlineUsers));

      // Notify others that user is offline
      socket.broadcast.emit('userOffline', {
        userId: socket.user.userId,
        username: socket.user.username,
        lastSeen: new Date(),
      });
    });

    // Handle private message to specific user
    socket.on('privateMessage', async (data) => {
      const { receiverId, content } = data;

      // Get or create conversation ID
      const sortedIds = [socket.user.userId, receiverId].sort();
      const conversationId = `${sortedIds[0]}_${sortedIds[1]}`;

      // Create message
      const message = await Message.create({
        sender: socket.user.userId,
        receiver: receiverId,
        conversationId,
        content,
      });

      await message.populate('sender', 'username avatar');
      await message.populate('receiver', 'username avatar');

      // Send to receiver if online
      const receiverSocketId = await getUserSocket(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('privateMessage', message);
      }

      // Send confirmation to sender
      socket.emit('privateMessage', message);
    });
  });

  return io;
};

module.exports = initializeSocket;
