import express from 'express';
import { container } from '@/container.js';
import { jwtAuthenticateSDK } from '@/middlewares/authenticate.middleware.js';
import { ChatController } from '@/controllers/chat.controller.js';
import { asyncHandler } from '@/utils/asyncHandler.js';

const router = express.Router();
const chatController = container.resolve(ChatController);

router.post('/chat', jwtAuthenticateSDK, asyncHandler(chatController.chat));

export default router;
