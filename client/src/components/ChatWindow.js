import React, { useState, useEffect, useRef } from 'react';
import useChat from '../hooks/useChat';
import Message from './Message';
import TypingIndicator from './TypingIndicator';
import './ChatWindow.css';

const ChatWindow = ({ conversationId, otherUser, currentUser }) => {
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  const {
    messages,
    loading,
    isTyping,
    sendMessage,
    markAsRead,
    startTyping,
    stopTyping,
    messagesEndRef,
  } = useChat(conversationId, otherUser?._id);

  // Mark messages as read when component mounts or new messages arrive
  useEffect(() => {
    if (messages.length > 0 && conversationId) {
      markAsRead();
    }
  }, [messages, conversationId, markAsRead]);

  // Handle typing indicator
  const handleTyping = (e) => {
    setMessageText(e.target.value);
    
    if (e.target.value) {
      startTyping();
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;
    
    setSending(true);
    stopTyping();
    
    try {
      await sendMessage(messageText);
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!otherUser) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h2>Select a conversation</h2>
          <p>Choose a user from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">
            {otherUser.avatar ? (
              <img src={otherUser.avatar} alt={otherUser.username} />
            ) : (
              <span>{otherUser.username?.charAt(0).toUpperCase()}</span>
            )}
            <div className={`status-indicator ${otherUser.isOnline ? 'online' : 'offline'}`} />
          </div>
          <div className="user-details">
            <h3>{otherUser.username}</h3>
            <span className="status">
              {otherUser.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {loading && messages.length === 0 ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Say hello!</p>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message, index) => (
              <Message
                key={message._id || index}
                message={message}
                isOwn={message.sender._id === currentUser._id}
              />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <form onSubmit={handleSendMessage} className="message-form">
          <textarea
            value={messageText}
            onChange={handleTyping}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            disabled={sending}
          />
          <button 
            type="submit" 
            disabled={!messageText.trim() || sending}
            className="send-button"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;
