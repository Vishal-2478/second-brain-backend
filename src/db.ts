import mongoose, { Schema } from "mongoose";

import { User } from "./Types/user.types";
import { Tag } from "./Types/tag.types";
import { Content } from "./Types/content.types";
import { ShareLink } from "./Types/shareLink.types";

const userSchema = new Schema<User>({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, {
    timestamps: true,
}
);

const tagSchema = new Schema<Tag>({
    title: { type: String, required: true, unique: true }
}, {
    timestamps: true,
}
);

const contentSchema = new Schema<Content>({
    link: { type: String, required: true },
    type: { type: String, enum: ['image', 'video', 'article', 'tweet', 'audio'], required: true },
    title: { type: String, required: true },
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, {
    timestamps: true,
}
);


const linkSchema = new Schema<ShareLink>({
    hash: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    status: { type: Boolean, default: false, required: true }
});

const UserModel = mongoose.model<User>("User", userSchema);
const tagModel = mongoose.model<Tag>("Tag", tagSchema);
const contentModel = mongoose.model<Content>("Content", contentSchema);
const linkModel = mongoose.model<ShareLink>("Link", linkSchema);

export {
    UserModel,
    tagModel,
    contentModel,
    linkModel
}
