import express from "express";
import {
    getSettings,
    updateSettings,
    resetSettings,
} from "../controllers/settings.controller.js";

const router = express.Router();

router.get("/get-user-settings/:userId", getSettings);
router.put("/save-user-settings", updateSettings);
router.post("/reset-settings", resetSettings);

export default router;