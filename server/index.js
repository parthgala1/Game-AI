import express from "express";
import connectToDatabase from "./database/mongo.db.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";
import cloudinary from "cloudinary";

// Custom Routes
import userRoutes from "./routes/user.route.js";
import settingsRoutes from "./routes/settings.route.js";

dotenv.config();

const app = express();

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));

app.get("/", (req, res) => {
    res.send("Connected to MongoDB!");
});
app.use("/api/user", userRoutes);
app.use("/api/settings", settingsRoutes);

// Initialize socket logic
// socketHandler(server);

const PORT = process.env.PORT || 4224;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

connectToDatabase();