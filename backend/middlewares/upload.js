import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); // o tu storage
export default upload;
