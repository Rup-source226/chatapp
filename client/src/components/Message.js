import React from 'react';
import { format } from 'timeago.js';
import './Message.css';

const Message = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return format(new Date(timestamp));
  };

  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        <div className="message-text">{message.content}</div>
        <div className="message-meta">
          <span className="message-time">{formatTime(message.createdAt)}</span>
          {isOwn && (
            <span className={`message-status ${message.isRead ? 'read' : 'sent'}`}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;
