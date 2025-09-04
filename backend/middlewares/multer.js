import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure temp uploads folder exists
const uploadsDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage config - local temp files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    const filename = file.fieldname + "-" + uniqueSuffix + extension;
    cb(null, filename);
  }
});

// Allowed file extensions and mime types
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed: ${allowedExtensions.join(", ")}`), false);
    }
  } else {
    cb(new Error("Only image files are allowed."), false);
  }
};

// Multer instance config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10                   // Max 10 images per request
  }
});

// Cleanup temp upload files after response ends
export const cleanupFiles = (req, res, next) => {
  const cleanup = () => {
    if (req.files) {
      const filesArray = Array.isArray(req.files)
        ? req.files
        : Object.values(req.files).flat();
      filesArray.forEach(file => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
  };
  res.on("finish", cleanup);
  res.on("close", cleanup);
  res.on("error", cleanup);
  next();
};

// Multer-specific error handler
export const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return res.status(400).json({ success: false, message: "File too large. Max size is 10MB." });
      case "LIMIT_FILE_COUNT":
        return res.status(400).json({ success: false, message: "Too many files. Max 10 files allowed." });
      case "LIMIT_UNEXPECTED_FILE":
        return res.status(400).json({ success: false, message: "Unexpected field name for file upload." });
      default:
        return res.status(400).json({ success: false, message: `Upload error: ${error.message}` });
    }
  }
  if (error.message.includes("Invalid file type") || error.message.includes("Only image files")) {
    return res.status(400).json({ success: false, message: error.message });
  }
  next(error);
};

// Export dedicated upload middlewares for products
export const productImageUpload = upload;          // Use .array("images", 10) in single create
export const productImageUploadAny = upload.any(); // Use in multi create (images_0, images_1...)

export default upload;
