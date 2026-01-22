import { Request, Response, Router } from "express";
const router = Router();
import jwt from "jsonwebtoken";
import { z } from "zod";
import bcrypt from "bcrypt";
import { UserModel } from "../db"
const saltRounds = 10;
import dotenv from "dotenv";
dotenv.config();


const signupSchema = z.object({
    username: z.string().min(3).max(10),
    password: z
        .string()
        .min(8)
        .max(20)
        .refine((password) => /[A-Z]/.test(password), { message: "Password must contain at least one uppercase letter" })
        .refine((password) => /[a-z]/.test(password), { message: "Password must contain at least one lowercase letter", })
        .refine((password) => /[0-9]/.test(password), { message: "Required atleast one number", })
        .refine((password) => /[!@#$%^&*]/.test(password), { message: "Required atleast one special character", })
});

const signinSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required")
});


router.post('/api/v1/signup', async (req: Request, res: Response): Promise<void> => {

    const parsedData = signupSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({
            success: false,
            message: parsedData.error.issues[0].message
        });
        return;
    }

    try {
        const { username, password } = parsedData.data;

        const findUser = await UserModel.findOne({ username });
        if (findUser) {
            res.status(409).json({
                success: false,
                message: "User already exists with this username"
            });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const user = new UserModel({
            username,
            password: hashedPassword
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: "User created successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});





router.post('/api/v1/signin', async (req: Request, res: Response): Promise<void> => {

    const parsedData = signinSchema.safeParse(req.body);

    if (!parsedData.success) {
        res.status(400).json({
            message: "Invalid input",
            error: parsedData.error.issues[0].message
        });
        return;
    }

    try {
        const { username, password } = parsedData.data;

        const findUser = await UserModel.findOne({ username });

        if (!findUser) {
            res.status(404).json({
                message: "User NOT Found"
            })
            return;
        }

        const passwordMatch = await bcrypt.compare(password, findUser.password);

        if (!passwordMatch) {
            res.status(401).json({
                message: "Invalid credentials"
            });
            return;
        }


        if (!process.env.JWT_SECRET_KEY) {
            console.error('JWT_SECRET_KEY is not defined in environment variables');
            res.status(500).json({
                message: "Server configuration error"
            });
            return;
        }

        const token = jwt.sign({
            id: findUser.id
        }, process.env.JWT_SECRET_KEY);

        res.status(200).json({
            message: "User logged in successfully",
            token: token
        })

    }
    catch (error) {
        res.status(500).json({
            message: "Server Error"
        })
        return;
    }
})





export default router;