import { Request, Response, Router } from "express";
import { authMiddleware } from "../middlewares/authMiddleware";
import { AuthenticatedRequest } from "../middlewares/authMiddleware";
import { contentModel, linkModel, tagModel, UserModel } from "../db";
import mongoose, { Types } from "mongoose";
import crypto from "crypto";

const router = Router();

function randomizer(length: number): string {
    return crypto.randomBytes(Math.ceil(length / 2))
        .toString("hex") // convert to hexadecimal
        .slice(0, length) // trim to desired length
        .toLowerCase();
}


// Create a new content
router.post('/api/v1/content', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    const { link, type, title, tags } = req.body;
    const tagTitles = tags || [];
    try {
        const userId = req.userId;

        if (!link || !type || !title) {
            res.status(400).json({
                message: "Missing required fields: link, type, and title are required"
            });
            return;
        }
        const validTypes = ['image', 'video', 'article', 'tweet', 'audio'];
        if (!validTypes.includes(type)) {
            res.status(400).json({
                message: "Invalid type. Must be one of: image, video, article, audio"
            });
            return;
        }

        const tagIds: Types.ObjectId[] = [];

        for (const tagTitle of tagTitles) {
            /*
            Your current approach is perfect for tag creation - for...of loop! 
            Promise.all would be faster but could create duplicate tags. 
            Stick with your for...of loop! Promise.all is amazing for independent read operations,
            */
            let tag = await tagModel.findOne({ title: tagTitle });

            if (!tag) {
                tag = await tagModel.create({ title: tagTitle });
            }

            tagIds.push(tag._id);
        }

        const newContent = await contentModel.create({
            link,
            type,
            title,
            tags: tagIds,
            userId
        });

        const populatedContent = await contentModel.findById(newContent._id)
            .populate("tags", "title")       // populates tags array with title field only
        // .populate("userId");    // (optional) populates user info


        res.status(201).json({
            populatedContent,
            message: "Content created successfully"
        })

    }
    catch (error) {
        console.error("Error creating content:", error);
        res.status(500).json({
            message: "Internal Server Error"
        })
    }
})


// Get all the contents of ourself
router.get('/api/v1/content', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    try {
        const userContents = await contentModel.find({ userId: new mongoose.Types.ObjectId(req.userId) })
            .populate("tags", "title")
            .populate("userId", "username")

        res.status(200).json({
            content: userContents,
            message: "Content retrieved successfully"
        })
    }
    catch (error) {
        console.error("Error fetching contents:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
})


// Delete a content
router.delete('/api/v1/content/:id', authMiddleware, async (req: AuthenticatedRequest, res) => {
    const id = req.params.id;
    const userId = req.userId;

    try {

        // short menthod
        //  const deletedContent = await contentModel.findOneAndDelete({
        //     _id: id,
        //     userId: userId
        // });

        const content = await contentModel.findById(id);

        if (!content) {
            res.status(404).json({
                message: "Content not found"
            });
            return;
        }
        if (content.userId.toString() !== userId) {
            res.status(403).json({
                message: "You are not authorized to delete this content"
            });
            return;
        }

        await contentModel.deleteOne({ _id: id });
        res.status(200).json({
            message: "Content deleted successfully"

        });
    }
    catch (error) {
        console.error("Error deleting content:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
})


// Create a shareable link for your second brain
router.post('/api/v1/brain/share', authMiddleware, async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    const userId = req.userId;
    const status: boolean = req.body.status;
    // console.log(status);

    try {
        const shareablelink = await linkModel.findOneAndUpdate(
            { userId },
            {
                $setOnInsert: {
                    hash: randomizer(30),
                },
                $set: {
                    status
                }
            },
            {
                new: true,
                upsert: true
            }
        );
        if (status) {
            res.status(200).json({
                message: "Link Shared",
                hash: shareablelink.hash,
                status: shareablelink.status,
            })
        } else {
            res.status(200).json({
                message: "Link is NOT Shared",
                status: shareablelink.status,
            })
        }
    }
    catch (error: any) {
        if (error.code === 11000) {
            // Duplicate key — link already created by parallel request
            const existing = await linkModel.findOne({ userId });
            res.status(200).json({
                message: "Link already exists",
                hash: existing?.hash,
                status: existing?.status
            });
        } else {
            console.error("Unexpected error:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
})


// Fetch another user's shared brain content
router.get('/api/v1/brain/:shareLink', async (req: AuthenticatedRequest, res: Response): Promise<void> => {

    const shareLink = req.params.shareLink;
    try {
        const shareableLink = await linkModel.findOne({ hash: shareLink });
        if (!shareableLink || shareableLink.status === false) {
            res.status(404).json({
                message: "link is invalid"
            });
            return;
        }

        const userId = shareableLink.userId;

        if (!userId) {
            res.status(404).json({
                message: "link is expired"
            });
            return;
        }

        const content = await contentModel.find({ userId }).populate("tags", "title").populate("userId", "username");

        if (!content) {
            res.status(404).json({
                message: "link is expired"
            });
            return;
        }

        res.status(200).json({
            content
        });
    }
    catch (error) {
        console.error("Error fetching content:", error);
        res.status(500).json({
            message: "Internal Server Error"
        });
    }
})

// In userContent.ts or a new tags route
router.get('/api/v1/tags', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query.q as string;
    try {
        const tags = await tagModel.find({
            title: { $regex: query, $options: 'i' } // case-insensitive search
        }).limit(10);

        res.status(200).json(tags);
    } catch (err) {
        console.error("Error fetching tags:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
});


export default router;