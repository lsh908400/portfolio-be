import { Date } from "mongoose";

export interface GetUser {
    _id: String,
    name : String,
    birth : String,
    addr : String,
    contacts : String,
    email : String,
    university : String,
    updatedAt: { type: Date, default: Date }
}