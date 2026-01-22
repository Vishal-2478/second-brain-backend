import { Types } from "mongoose";

export interface ShareLink {
    hash: string;
    userId: Types.ObjectId;
    status: boolean;
}
