
import multer from "multer";
import crypto from "crypto";
import path from "path";
import fs from "fs";

const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    try {
      const allowedTypes = /pdf|jpeg|jpg|png|heic/i;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase()
      );
      const mimetype =
        allowedTypes.test(file.mimetype) || file.mimetype === "image/heic";

      if (!extname || !mimetype) {
        return cb(
          new Error("Only PDF, PNG, JPG, JPEG, and HEIC files are allowed."),
          false
        );
      }

      cb(null, true);
    } catch (error) {
      cb(new Error("File validation failed."), false);
    }
  },
}).array("files", 2);
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "controllers/clientDocumentUpload/uploads";
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const filename = `${Date.now()}-${file.originalname}`;
    file.savedPath = path.join(
      "controllers/clientDocumentUpload/uploads",
      filename
    );
    cb(null, filename);
  },
});
const getFileHash = (buffer) => {
  return crypto.createHash("sha256").update(buffer).digest("hex");
};
export const handleUpload = (req, res, next) => {
  memoryUpload(req, res, (err) => {
    if (err) {
      console.error("Upload Error during validation:", err.message);
      return res.status(400).json({ success: "false", message: err.message });
    }
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ success: "false", message: "No files uploaded." });
    }
    const fileHashes = new Set();
    const uploadPath = "controllers/clientDocumentUpload/uploads";
    try {
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      for (const file of req.files) {
        const fileHash = getFileHash(file.buffer);
        if (fileHashes.has(fileHash)) {
          return res.status(400).json({
            success: false,
            message: "Duplicate files detected. Please upload unique files.",
          });
        }
        fileHashes.add(fileHash);
        const filename = `${Date.now()}-${file.originalname}`;
        const filePath = path.join(uploadPath, filename);

        fs.writeFileSync(filePath, file.buffer);

        file.filename = filename;
        file.path = filePath;
        file.savedPath = filePath;
      }

      next();
    } catch (error) {
      console.error("Error saving files to disk:", error.message);
      return res
        .status(500)
        .json({ success: "false", message: "Failed to save files" });
    }
  });
};