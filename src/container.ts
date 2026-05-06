import 'reflect-metadata';
import { container } from 'tsyringe';
import { ChatService } from '@/services/chat.service.js';
import { ChatController } from '@/controllers/chat.controller.js';

container.register(ChatService, { useClass: ChatService });
container.register(ChatController, { useClass: ChatController });

export { container };
