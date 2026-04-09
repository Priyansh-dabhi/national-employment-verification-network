import multer from 'multer';

// Use memory storage to avoid writing unencrypted files to disk
const storage = multer.memoryStorage();

// Allowed file types
const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png'];

const fileFilter = (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: fileFilter
});
