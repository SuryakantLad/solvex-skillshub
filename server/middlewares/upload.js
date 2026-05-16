import multer from 'multer';

const storage = multer.memoryStorage();

function pdfFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(Object.assign(new Error('Only PDF files are supported'), { status: 400 }), false);
  }
}

export const uploadSingle = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('resume');

export const uploadMultiple = multer({
  storage,
  fileFilter: pdfFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
}).array('resumes', 20);
