import { generateUniqueUsername } from "../helpers/username.helper.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "cloudinary";

export const createUser = async (req, res) => {
    const { fullName, email, phone, dateOfBirth, gender, password } = req.body;

    const primaryImageFile = req.files.profileImage ? req.files.profileImage[0] : null;

    try {
        if (!fullName || !phone || !email || !dateOfBirth || !gender || !password) {
            return res.status(400).json({ error: "Please enter all the details!" });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });
        if (existingUser) {
            return res
                .status(400)
                .json({ error: "User with this email already exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const generatedUserName = await generateUniqueUsername(fullName, email, phone);

        let primaryImageUrl = null;

        if (primaryImageFile) {
            try {
                const b64 = Buffer.from(primaryImageFile.buffer).toString("base64");
                const dataURI = "data:" + primaryImageFile.mimetype + ";base64," + b64;

                const cldRes = await cloudinary.uploader.upload(dataURI, {
                    resource_type: "auto",
                });

                primaryImageUrl = cldRes.secure_url;
            } catch (uploadError) {
                console.error("Error uploading primary image to Cloudinary:", uploadError);
                return res.status(500).json({ error: "Error uploading primary image" });
            }
        }

        const newUser = new User({
            fullName,
            email,
            userName: generatedUserName,
            profileImageUrl: primaryImageUrl,
            gender,
            phone,
            dateOfBirth,
            password: hashedPassword
        });

        await newUser.save();

        const userData = {
            userId: newUser._id,
            userName: newUser.userName,
            profileImageUrl: newUser.profileImageUrl,
            fullName: newUser.fullName
        };

        res
            .status(201)
            .json({ message: "User created successfully", user: userData });
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ error: "Please enter all the details!" });
        }

        const existingUser = await User.findOne({ email: email });

        if (!existingUser) {
            return res
                .status(400)
                .json({ error: "User with this email doesn't exists!" });
        }

        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const userData = {
            userId: existingUser._id,
            userName: existingUser.userName,
            profileImageUrl: existingUser.profileImageUrl,
            fullName: existingUser.fullName
        };

        res
            .status(201)
            .json({ message: "User created successfully", user: userData });

    } catch (error) {
        console.error("Error login user:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}