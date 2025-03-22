import { Schema } from "mongoose";

/**
 * VersionChange 모델 스키마 
 */
export const VersionChangeSchema = new Schema({
    id: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['feature', 'improvement', 'bugfix', 'security'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    issueId: {
        type: String
    }
}, { _id: false }); // 중첩 문서에서는 _id를 생성하지 않음

/**
 * Version 모델 스키마 
 */
export const VersionSchema = new Schema({
    _id: { 
        type: String  // 버전을 ID로 활용할 수 있음
    },
    version: {
        type: String,
        required: true,
        unique: true
    },
    releaseDate: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['stable', 'beta', 'alpha', 'rc'],
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    changes: {
        type: [VersionChangeSchema],
        required: true,
        default: []
    },
    downloadLink: {
        type: String
    },
    knownIssues: {
        type: [String],
        default: []
    },
    upgradeNotes: {
        type: String
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
 * VersionCollection 스키마 (필요한 경우)
 */
export const VersionCollectionSchema = new Schema({
    _id: { 
        type: String 
    },
    projectName: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    versions: {
        type: [{ type: String, ref: 'Version' }],
        default: []
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