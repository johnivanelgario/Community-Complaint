import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const ok = /jpeg|jpg|png|webp/.test(path.extname(file.originalname).toLowerCase());
  cb(ok ? null : new Error("Photo must be jpg, png or webp"), ok);
};

export default multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
