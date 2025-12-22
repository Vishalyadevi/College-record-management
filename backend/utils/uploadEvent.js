import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/events/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
}).fields([
  { name: 'certificate_file', maxCount: 1 },
  { name: 'achievement_certificate_file', maxCount: 1 },
  { name: 'cash_prize_proof', maxCount: 1 },
  { name: 'memento_proof', maxCount: 1 }
]);

export default upload;