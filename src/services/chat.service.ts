import { injectable } from 'tsyringe';

@injectable()
export class ChatService {
    constructor() {
    }

    public chat = async (message: string): Promise<string> => {
        return "Hello from chat! with" + message;
    }
}