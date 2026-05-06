import express from "express";
import type { Application, Request, Response } from 'express';
import cors from "cors";
import dotenv from "dotenv";

const app: Application = express();

app.use(cors());
app.use(express.json());

app.use(express.urlencoded({ extended: true }));
app.get('/', (req: Request, res: Response) => {
    res.send('Hello Express + TypeScript!');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
})