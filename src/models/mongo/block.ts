import { Schema } from "mongoose";

/**
 * Block 모델 스키마 
 */
export const BlockSchema = new Schema({
    id: String,
    parentId: String,
    type: {
        type: String,
        enum: ['paragraph', 'header', 'list', 'img', 'title' , 'code'],
        required: true
    },
    data: {
        text: String,
        level: Number,
        items: [String],
        url: String,
        caption: String,
        style : {
            type: String,
            enum: ['underline','bold','crooked','cancelline','link','basic']
        },
        color : String,
        imageWidth : Number,
        imageHeight : Number,
        language : String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    index : Number,
}, { timestamps: true });

/**
 * Block 컬렉션 스키마 
 */
export const BlockCollectionSchema = new Schema({
    _id: { type: String }, // 여기를 수정
    title: String,
    // blocks 필드는 실제로 사용하지 않음
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }, { timestamps: true });