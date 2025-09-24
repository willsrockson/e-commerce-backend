import multer, { FileFilterCallback } from "multer";
import { Request } from "express";

interface IFileType{
    fileSize: number;
    numOfFiles: number;
}

const fileFilter = (req: Request, adImages: { mimetype:string; }, cb: FileFilterCallback) => {
    if (adImages.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'));
    }
};

export const uploadFilter = ({fileSize, numOfFiles}: IFileType)=>{
   const upload = multer({ dest: 'uploads/' , fileFilter , limits: { fileSize: fileSize, files: numOfFiles }});
   return upload;
}