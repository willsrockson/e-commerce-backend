import express, { Request } from "express";
const router = express.Router();
import multer, { FileFilterCallback } from "multer";

interface Images{
    mimetype: string;
}

// File filter to accept only images
const fileFilter = (req: Request, adImages: Images, cb: FileFilterCallback) => {
    if (adImages.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb( new Error('You can upload images only!')); // Reject files that aren't image
    }
};

const upload = multer({ dest: 'uploads/' , fileFilter , limits: { fileSize: 5 * 1024 * 1024, files: 7 }});






import { postMobilePhonesAds } from "../../../controllers/postAds/electronics/postMobilePhonesAdController";

//Don't forget to extract file checker as middleware

//router.post("/upload", upload.array('adImages', 7), postAds);
router.post("/mobilephones", (req, res) => {
    upload.array('adImages', 7)(req, res, (err) => {
        if (err instanceof multer.MulterError) { 
            res.status(400).json({ error: err.message });
            return;
        }
        postMobilePhonesAds(req, res);
    });
});


export default router;