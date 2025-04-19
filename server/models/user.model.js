import { model, Schema } from "mongoose";

const UserSchema = new Schema(
    {

        fullName: { type: String, required: true },
        userName: { type: String },
        password: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, default: "+1234567890" },
        dateOfBirth: { type: String, default: "2004-01-01" },
        gender: { type: String, enum: ["Male", "Female", "Other"], },
        profileImageUrl: { type: String, default: "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" },
    },
    { timestamps: true }
);

const User = model("User", UserSchema);

export default User;