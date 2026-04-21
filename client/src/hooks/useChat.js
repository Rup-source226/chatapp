import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesAPI } from '../services/api';
import socketService from '../services/socket';

export const useChat = (conversationId, otherUserId) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load messages for conversation
  const loadMessages = useCallback(async (page = 1) => {
    if (!conversationId) return;

    setLoading(true);
    try {
      const response = await messagesAPI.getMessages(conversationId, { page, limit: 50 });
      const newMessages = response.data.data.messages;

      if (page === 1) {
        setMessages(newMessages);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  // Send message
  const sendMessage = useCallback(async (content, messageType = 'text') => {
    if (!content.trim() || !otherUserId) return;

    try {
      const response = await messagesAPI.sendMessage({
        receiverId: otherUserId,
        content: content.trim(),
        messageType,
      });

      const newMessage = response.data.data.message;
      setMessages(prev => [...prev, newMessage]);

      // Send via socket
      socketService.sendMessage({
        receiverId: otherUserId,
        content: content.trim(),
        conversationId,
        messageType,
      });

      return newMessage;
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
      throw err;
    }
  }, [conversationId, otherUserId]);

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!conversationId) return;

    try {
      await messagesAPI.markAsRead(conversationId);
      setMessages(prev =>
        prev.map(msg =>
          msg.receiver._id === otherUserId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Mark as read error:', err);
    }
  }, [conversationId, otherUserId]);

  // Handle typing indicator
  const startTyping = useCallback(() => {
    socketService.sendTyping({
      conversationId,
      receiverId: otherUserId,
      isTyping: true,
    });
  }, [conversationId, otherUserId]);

  const stopTyping = useCallback(() => {
    socketService.sendTyping({
      conversationId,
      receiverId: otherUserId,
      isTyping: false,
    });
  }, [conversationId, otherUserId]);

  // Socket event handlers
  useEffect(() => {
    if (!socketService.isConnected()) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    const handleTyping = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(data.isTyping);
      }
    };

    const handleSeen = (data) => {
      if (data.conversationId === conversationId) {
        setMessages(prev =>
          prev.map(msg =>
            data.messageIds.includes(msg._id)
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      }
    };

    const handleOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    // Register event listeners
    socketService.on('message', handleNewMessage);
    socketService.on('typing', handleTyping);
    socketService.on('seen', handleSeen);
    socketService.on('onlineUsers', handleOnlineUsers);

    // Join conversation room
    if (conversationId) {
      socketService.joinConversation(conversationId);
    }

    return () => {
      // Cleanup event listeners
      socketService.off('message', handleNewMessage);
      socketService.off('typing', handleTyping);
      socketService.off('seen', handleSeen);
      socketService.off('onlineUsers', handleOnlineUsers);

      // Leave conversation room
      if (conversationId) {
        socketService.leaveConversation(conversationId);
      }
    };
  }, [conversationId]);

  // Load messages when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId, loadMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return {
    messages,
    loading,
    error,
    isTyping,
    unreadCount,
    onlineUsers,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    loadMoreMessages: () => loadMessages(Math.ceil(messages.length / 50) + 1),
    messagesEndRef,
  };
};

export default useChat;
