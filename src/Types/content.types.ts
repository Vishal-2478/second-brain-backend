import { Types } from "mongoose";

export interface Content {
    link: string;
    type: 'image' | 'video' | 'article' | 'audio'; // matches enum
    title: string;
    tags?: Types.ObjectId[];
    userId: Types.ObjectId;
}
