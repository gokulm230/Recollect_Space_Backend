const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/Db");
const authRoutes = require("./routes/AuthRoutes");
const folderRoutes = require("./routes/FolderRoutes");
const path = require("path");
const blogRoutes = require("./routes/Blogroutes");
const Photo = require("./routes/Photo");
const { loadModels } = require("./controllers/PhotoController");

dotenv.config();
connectDB();
const PORT = process.env.PORT || 5000;

const app = express();
app.use("/models", express.static(path.join(__dirname, "models2")));
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/folders", folderRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api", blogRoutes);
app.use("/api/photos", Photo);

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const initServer = async () => {
  try {
    console.log("Loading face-api models...");
    await loadModels();
    console.log("All models loaded successfully");

    // Start the server after models are loaded
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to initialize server:", error);
    process.exit(1);
  }
};

// Initialize the server
initServer();
