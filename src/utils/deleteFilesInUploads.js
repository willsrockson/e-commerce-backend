import path from 'path'
import * as fs from "fs"

export const deleteAllFilesAfterUpload = async(folderPath) => {
    fs.readdir(folderPath, (err, files) => {
        if (err) {
            console.error('Error reading folder:', err.message);
            return;
        }
    
        files.forEach((file) => {
            const filePath = path.join(folderPath, file);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error(`Error deleting ${file}:`, err.message);
                } else {
                    console.log(`${file} deleted successfully`);
                }
            });
        });
    });
}