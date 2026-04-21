const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Validation rules
const sendMessageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required'),
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ max: 5000 })
    .withMessage('Message cannot exceed 5000 characters'),
];

// Message routes
router.post('/', sendMessageValidation, messageController.sendMessage);
router.get('/conversation/:conversationId', messageController.getMessages);
router.get('/conversation/user/:userId', messageController.getConversation);
router.put('/conversation/:conversationId/read', messageController.markAsRead);
router.get('/unread', messageController.getUnreadCount);
router.delete('/:messageId', messageController.deleteMessage);

module.exports = router;
