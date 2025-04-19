import User from "../models/user.model.js";

export const generateUniqueUsername = async (fullName, email, phone) => {
    try {
        const emailBase = email.split('@')[0];

        const nameBase = fullName.toLowerCase().replace(/\s+/g, '');

        const phoneBase = phone.slice(-4);

        const attempts = [
            nameBase,
            `${nameBase}${phoneBase}`,
            `${emailBase}`,
            `${emailBase}${phoneBase}`,
            `${nameBase}${Math.floor(1000 + Math.random() * 9000)}`
        ];

        for (const attempt of attempts) {
            const existingUser = await User.findOne({ userName: attempt });
            if (!existingUser) {
                return attempt;
            }
        }

        return `user${Math.floor(100000 + Math.random() * 900000)}`;
    } catch (error) {
        console.error('Error generating username:', error);
        return `user${Math.floor(100000 + Math.random() * 900000)}`;
    }
};