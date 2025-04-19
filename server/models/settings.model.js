import { model, Schema } from "mongoose";

const SettingsSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        masterVolume: { type: Number, default: 80 },
        sfxVolume: { type: Number, default: 90 },
        musicVolume: { type: Number, default: 70 },
        soundEnabled: { type: Boolean, default: true },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium"
        },
        particleEffects: { type: Boolean, default: true },
        screenShake: { type: Boolean, default: true },
        highContrast: { type: Boolean, default: false },
        pixelatedRendering: { type: Boolean, default: true },
        showFPS: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const Settings = model("Settings", SettingsSchema);

export default Settings;