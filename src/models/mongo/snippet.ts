import { Schema } from "mongoose";

export const SnippetSchema = new Schema({     
    id: String, 
    title: String,     
    code: String,     
    language: String,     
    desc: String,     
    tags: [String], 
    createdAt: String, 
});