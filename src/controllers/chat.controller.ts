import { injectable, inject } from 'tsyringe';
import type { Response } from 'express';
import type { ChatRequest } from '@/types/chat.types.js';
import { Success } from '@/utils/responseHandler.js';
import { ChatService } from '@/services/chat.service.js';

@injectable()
export class ChatController {
    constructor(@inject(ChatService) private readonly chatService: ChatService) {}

    public chat = async (req: ChatRequest, res: Response): Promise<Response> => {
        const { message } = req.query;
        const result = await this.chatService.chat(message);
        return Success(res, result);
    }
}
