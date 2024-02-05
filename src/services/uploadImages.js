import multer from 'multer';
import path from 'path';
import { __dirname } from '../utils.js';


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "/public/images/products/")); // Directorio donde se guardarán las imágenes
  },
  filename: (req, file, cb) => {
    console.log('aca el file: '+JSON.stringify(file, null, 5))
    console.log(file.originalname)
    const modifiedName = file.originalname.replace(/\s+/g, '_');
    console.log(modifiedName)
    const fileName = `/${Date.now()}_${modifiedName}`;
    console.log(fileName)
    cb(null, fileName);
  },
});

const uploadImage = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 }, // Limitar el tamaño del archivo a 5MB
});

export default uploadImage;
