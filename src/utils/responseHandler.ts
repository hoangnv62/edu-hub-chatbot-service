import type {Response} from "express";
import {HttpStatus} from "@/utils/errors.js";

export const Success = <T>(res: Response, data: T): Response => {
    return res.status(HttpStatus.OK).json(data);
}
