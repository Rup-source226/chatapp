import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import socketService from '../services/socket';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import './ChatPage.css';

const ChatPage = () => {
  const { user, token, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [loading, isAuthenticated, navigate]);

  // Connect to socket when user is authenticated
  useEffect(() => {
    if (token) {
      socketService.connect(token);
    }

    return () => {
      socketService.disconnect();
    };
  }, [token]);

  // Handle user selection
  const handleSelectUser = (user, conversationId) => {
    setSelectedUser(user);
    setConversationId(conversationId);
  };

  // Handle logout
  const handleLogout = () => {
    socketService.disconnect();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="chat-page loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="chat-page">
      <Sidebar 
        currentUser={user} 
        onSelectUser={handleSelectUser}
        selectedUser={selectedUser}
      />
      <ChatWindow 
        conversationId={conversationId}
        otherUser={selectedUser}
        currentUser={user}
      />
    </div>
  );
};

export default ChatPage;
