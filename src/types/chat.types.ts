import type { Request } from "express";

export interface ChatQuery {
    message: string;
}

export type ChatRequest = Request<{}, {}, {}, ChatQuery>;
