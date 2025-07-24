import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

// Temporary storage in memory
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Custom middleware to process and save the image
export const processAndSaveImage = async (req, res, next) => {
  if (!req.file) return next();

  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const filename = uniqueSuffix + path.extname(req.file.originalname);
  const filePath = path.join("uploads", filename);

  try {
    await sharp(req.file.buffer)
      .resize({ width: 800 })
      .jpeg({ quality: 70 }) // ✅ Corrected quality value
      .toFile(filePath);

    req.file.filename = filename;
    next();
  } catch (error) {
    console.error("Image processing error:", error);
    res.status(500).json({ message: "Image processing failed" });
  }
};

export default upload;
