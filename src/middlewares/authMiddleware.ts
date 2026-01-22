import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export interface AuthenticatedRequest extends Request {
    userId?: string; // add a type-safe way to access userId later
}



export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {

    const authHeader = req.headers.authorization;

    // Check if Authorization header exists and is well-formed
    if (!authHeader) {
        return res.status(401).json({ message: "Authorization 1 token missing or malformed" });
    }
    if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Authorization 2 token missing or malformed" });
    }

    const token = authHeader.split(" ")[1]; // Extract token after 'Bearer '

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as { id: string };

        // Attach the user ID to the request object (not req.body)
        req.userId = decoded.id;
        next();

    }
    catch (err) {
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}
