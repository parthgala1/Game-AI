import express from "express";
import { createUser, loginUser } from "../controllers/user.controller.js";
import { upload } from "../middlwares/multer.middleware.js";

const router = express.Router();

router.post("/register", upload.fields([{ name: "profileImage", count: 1 }]), createUser);
router.post("/login", loginUser);

export default router;