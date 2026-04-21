import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_WS_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  // Initialize socket connection
  connect(token) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    return this.socket;
  }

  // Disconnect socket
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Get socket instance
  getSocket() {
    return this.socket;
  }

  // Join a conversation room
  joinConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('join', conversationId);
    }
  }

  // Leave a conversation room
  leaveConversation(conversationId) {
    if (this.socket) {
      this.socket.emit('leave', conversationId);
    }
  }

  // Send a message
  sendMessage(data) {
    if (this.socket) {
      this.socket.emit('message', data);
    }
  }

  // Send typing indicator
  sendTyping(data) {
    if (this.socket) {
      this.socket.emit('typing', data);
    }
  }

  // Send seen status
  sendSeen(data) {
    if (this.socket) {
      this.socket.emit('seen', data);
    }
  }

  // Send private message
  sendPrivateMessage(data) {
    if (this.socket) {
      this.socket.emit('privateMessage', data);
    }
  }

  // Add event listener
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
      this.listeners.set(event, callback);
    }
  }

  // Remove event listener
  off(event) {
    if (this.socket) {
      this.socket.off(event);
      this.listeners.delete(event);
    }
  }

  // Check if connected
  isConnected() {
    return this.socket?.connected || false;
  }
}

// Export singleton instance
export const socketService = new SocketService();
export default socketService;
