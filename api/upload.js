// backend/api/upload.js

import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

// AWS S3 config
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET,
    acl: "public-read",
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      cb(null, Date.now() + "-" + file.originalname);
    },
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (
      [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.mimetype)
    )
      cb(null, true);
    else cb(new Error("Invalid file type."), false);
  },
});

const runMiddleware = (req, res, fn) =>
  new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) reject(result);
      resolve(result);
    });
  });

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Only POST allowed" });

  try {
    await runMiddleware(req, res, upload.single("file"));
    const { studentInfo, title, abstract, domain, classSection, guide } = req.body;
    return res.status(200).json({
      message: "Project submitted successfully!",
      fileUrl: req.file.location,
      data: { studentInfo, title, abstract, domain, classSection, guide },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
