import express from "express";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import authRoutes from "./routes/userAuth";
import userContentRoutes from "./routes/userContent";
import cors from "cors";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cors());

app.use(authRoutes);
app.use(userContentRoutes);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URL!);
        console.log("Connected to MongoDB");
    }
    catch (err) {
        console.log(err);
        throw err;
    }
    finally {
        return;
    }
}

app.listen(PORT, () => {
    connectDB();
    console.log(`Server is running on port ${PORT}`);
})