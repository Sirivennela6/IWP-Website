import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "project-submissions",
    resource_type: "auto",
    allowed_formats: ["pdf", "doc", "docx"],
    public_id: (req, file) => {
      return Date.now() + '-' + file.originalname.split('.')[0];
    }
  },
});

// Configure Multer
const upload = multer({ 
  storage, 
  limits: { 
    fileSize: 4 * 1024 * 1024 // 4MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.'));
    }
  }
});

// Middleware wrapper
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      resolve(result);
    });
  });
}

// Main handler function for Vercel
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ 
      error: "Method not allowed. Only POST requests are supported." 
    });
  }

  try {
    // Check if environment variables are set
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing Cloudinary environment variables');
      return res.status(500).json({ 
        error: "Server configuration error. Please contact administrator." 
      });
    }

    // Run multer middleware
    await runMiddleware(req, res, upload.single("file"));

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        error: "No file uploaded. Please select a file to upload." 
      });
    }

    console.log('File uploaded successfully:', req.file.originalname);

    // Return success response
    return res.status(200).json({
      message: "File uploaded successfully!",
      fileUrl: req.file.path,
      publicId: req.file.public_id,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    
    return res.status(500).json({ 
      error: error.message || "An error occurred during file upload." 
    });
  }
}