import { Schema } from "mongoose";

/**
 * 사용자 모델 인터페이스
 */
export const UserSchema = new Schema({
    _id: String,
    name : String,
    birth : String,
    addr : String,
    contacts : String,
    email : String,
    university : String,
    updatedAt: { type: Date, default: Date.now }
});

/**
 * 자기소개서 모델 인터페이스
 */
export const IntroductionSchema = new Schema({
    _id: String,
    subtitle : String,
    motivation : String,
    growth : String,
    adventage : String,
    goals : String,
});