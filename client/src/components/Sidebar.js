import React, { useState, useEffect } from 'react';
import { authAPI, messagesAPI } from '../services/api';
import { format } from 'timeago.js';
import './Sidebar.css';

const Sidebar = ({ currentUser, onSelectUser, selectedUser }) => {
  const [users, setUsers] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Load users and conversations
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersResponse = await authAPI.getAllUsers({ limit: 50 });
        // Filter out current user
        const otherUsers = usersResponse.data.data.users.filter(
          user => user._id !== currentUser._id
        );
        setUsers(otherUsers);

        // Fetch unread count
        const unreadResponse = await messagesAPI.getUnreadCount();
        setUnreadTotal(unreadResponse.data.data.unreadCount);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser._id]);

  // Handle user selection
  const handleUserClick = async (user) => {
    try {
      // Get or create conversation
      const response = await messagesAPI.getConversation(user._id);
      const { conversationId } = response.data.data;
      
      onSelectUser(user, conversationId);
    } catch (error) {
      console.error('Failed to get conversation:', error);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="user-profile">
          <div className="avatar">
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt={currentUser.username} />
            ) : (
              <span>{currentUser.username?.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="user-info">
            <h3>{currentUser.username}</h3>
            <span className="status">Online</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Users List */}
      <div className="users-list">
        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="no-users">No users found</div>
        ) : (
          filteredUsers.map(user => (
            <div
              key={user._id}
              className={`user-item ${selectedUser?._id === user._id ? 'active' : ''}`}
              onClick={() => handleUserClick(user)}
            >
              <div className="avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <span>{user.username?.charAt(0).toUpperCase()}</span>
                )}
                <div className={`status-indicator ${user.isOnline ? 'online' : 'offline'}`} />
              </div>
              <div className="user-details">
                <div className="user-header">
                  <h4>{user.username}</h4>
                  {user.lastSeen && (
                    <span className="last-seen">
                      {user.isOnline ? 'Online' : format(new Date(user.lastSeen))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Sidebar;
