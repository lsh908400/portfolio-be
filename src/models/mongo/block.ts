import { Schema } from "mongoose";

/**
 * Block 모델 스키마 
 */
export const BlockSchema = new Schema({
    _id: String,
    parentId: String,
    type: {
        type: String,
        enum: ['paragraph', 'header', 'list', 'image', 'title'],
        required: true
    },
    data: {
        text: String,
        level: Number,
        items: [String],
        url: String,
        caption: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

/**
 * Block 컬렉션 스키마 
 */
export const BlockCollectionSchema = new Schema({
    title: String,
    blocks: [BlockSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });