import Settings from "../models/settings.model.js";

export const getSettings = async (req, res) => {
    try {
        const { userId } = req.params;

        const settings = await Settings.findOne({ userId });

        if (!settings) {
            const newSettings = await Settings.create({ userId });
            return res.status(200).json(newSettings);
        }

        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { userId, updates } = req.body;

        const settings = await Settings.findOneAndUpdate(
            { userId },
            { $set: updates },
            { new: true, upsert: true }
        );

        res.status(200).json({
            message: "Settings updated successfully",
            settings,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const resetSettings = async (req, res) => {
    try {
        const { userId } = req.body;

        const defaultSettings = {
            masterVolume: 50,
            sfxVolume: 50,
            musicVolume: 50,
            soundEnabled: true,
            difficulty: "medium",
            particleEffects: true,
            screenShake: true,
            highContrast: false,
            pixelatedRendering: true,
            showFPS: false,
        };

        const settings = await Settings.findOneAndUpdate(
            { userId },
            { $set: defaultSettings },
            { new: true }
        );

        res.status(200).json({
            message: "Settings reset to defaults",
            settings,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};