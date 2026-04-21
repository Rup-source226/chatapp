const redis = require('redis');

let redisClient = null;
let isConnected = false;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
      legacyMode: false
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      isConnected = false;
    });

    redisClient.on('connect', () => {
      console.log('Redis Client Connected');
      isConnected = true;
    });

    redisClient.on('ready', () => {
      console.log('Redis Client Ready');
      isConnected = true;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis Client Reconnecting');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('Redis Connection Error:', error.message);
    isConnected = false;
  }
};

// Cache helper functions
const cacheGet = async (key) => {
  try {
    if (!redisClient || !isConnected) return null;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis GET Error:', error.message);
    return null;
  }
};

const cacheSet = async (key, value, expirySeconds = 3600) => {
  try {
    if (!redisClient || !isConnected) return false;
    await redisClient.set(key, JSON.stringify(value), {
      EX: expirySeconds,
    });
    return true;
  } catch (error) {
    console.error('Redis SET Error:', error.message);
    return false;
  }
};

const cacheDelete = async (key) => {
  try {
    if (!redisClient || !isConnected) return false;
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis DELETE Error:', error.message);
    return false;
  }
};

// User session caching
const cacheUserSession = async (userId, sessionData) => {
  return cacheSet(`session:${userId}`, sessionData, 86400); // 24 hours
};

const getCachedUserSession = async (userId) => {
  return cacheGet(`session:${userId}`);
};

const invalidateUserSession = async (userId) => {
  return cacheDelete(`session:${userId}`);
};

// Online users tracking
const setUserOnline = async (userId, socketId) => {
  try {
    if (!redisClient || !isConnected) return false;
    await redisClient.hSet('online_users', userId, socketId);
    await redisClient.expire('online_users', 3600);
    return true;
  } catch (error) {
    console.error('Redis SET Online Error:', error.message);
    return false;
  }
};

const setUserOffline = async (userId) => {
  try {
    if (!redisClient || !isConnected) return false;
    await redisClient.hDel('online_users', userId);
    return true;
  } catch (error) {
    console.error('Redis SET Offline Error:', error.message);
    return false;
  }
};

const getUserSocket = async (userId) => {
  try {
    if (!redisClient || !isConnected) return null;
    const socketId = await redisClient.hGet('online_users', userId);
    return socketId || null;
  } catch (error) {
    console.error('Redis GET Socket Error:', error.message);
    return null;
  }
};

const getAllOnlineUsers = async () => {
  try {
    if (!redisClient || !isConnected) return [];
    const users = await redisClient.hGetAll('online_users');
    return users || {};
  } catch (error) {
    console.error('Redis GET All Online Error:', error.message);
    return [];
  }
};

module.exports = {
  connectRedis,
  redisClient,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheUserSession,
  getCachedUserSession,
  invalidateUserSession,
  setUserOnline,
  setUserOffline,
  getUserSocket,
  getAllOnlineUsers,
  isConnected: () => isConnected,
};
