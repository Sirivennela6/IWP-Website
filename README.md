# IWP WEBSITE - Project Submission and Evaluation System

## Features
- Student project file upload with permanent S3 storage
- Faculty reviewer file preview (directly from S3)
- Globally accessible, serverless backend (Node.js API)
- Cloud-hosting ready (Vercel)

## Setup & Deployment

1. Clone this repo.
2. Install backend dependencies in `/backend`:
cd backend
npm install

text
3. At project root, add a `.env` file with AWS S3 credentials like this:
AWS_REGION=ap-south-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...

text
4. Deploy to Vercel.
5. **Frontend**: Ensure all assets and HTML reference correct S3 file URLs for preview.

## File Structure
- `/api/upload.js` — API route for uploads (Node.js + S3)
- `/frontend/index.html` — File upload form
- `/frontend/assessment.html` — File viewer for submitted files

## Environment Variables
Set all S3 credentials in Vercel dashboard for production. Never commit `.env` to GitHub.

---

## 4. `/api/upload.js` (Root, Node.js API route)

// /api/upload.js
import multer from "multer";
import multerS3 from "multer-s3";
import { S3Client } from "@aws-sdk/client-s3";

const s3 = new S3Client({
region: process.env.AWS_REGION,
credentials: {
accessKeyId: process.env.AWS_ACCESS_KEY_ID,
secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
}
});

const upload = multer({
storage: multerS3({
s3,
bucket: process.env.AWS_S3_BUCKET,
acl: "public-read",
contentType: multerS3.AUTO_CONTENT_TYPE,
key: function (req, file, cb) {
const uniqueName = Date.now() + "-" + file.originalname;
cb(null, uniqueName);
}
}),
limits: { fileSize: 4 * 1024 * 1024 },
fileFilter: (req, file, cb) => {
if (
["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(
file.mimetype
)
) {
cb(null, true);
} else {
cb(new Error("Invalid file type, only PDF/DOC/DOCX allowed!"), false);
}
}
});

const runMiddleware = (req, res, fn) =>
new Promise((resolve, reject) => {
fn(req, res, (result) => {
if (result instanceof Error) return reject(result);
return resolve(result);
});
});

export const config = {
api: { bodyParser: false }
};

let submissions = [];

export default async function handler(req, res) {
if (req.method !== "POST") {
return res.status(405).json({ error: "Method not allowed" });
}
try {
await runMiddleware(req, res, upload.single("file"));
const submission = {
studentInfo: req.body.studentInfo,
title: req.body.title,
abstract: req.body.abstract,
domain: req.body.domain,
classSection: req.body.classSection,
guide: req.body.guide,
fileUrl: req.file.location,
uploadedAt: Date.now()
};
// Save info to in-memory array. Replace with DB for production use.
submissions.push(submission);
return res.status(200).json({ message: "Project submitted!", fileUrl: req.file.location, submission });
} catch (err) {
return res.status(500).json({ error: err.message });
}
}

text
**Note:** If you want persistence across deploys, use a DB instead of in-memory.  
If you want an API to get file URLs by student info, add a `/api/list.js` file later.

---

## 5. `frontend/index.html` (Upload Form)

- Ensure your HTML form POSTs to `/api/upload` with AJAX.
- On upload success, display the returned `fileUrl` so you can reference it on the assessment page.

Update (or create) the file input handler in your form JS:

document.getElementById("projectForm").addEventListener("submit", async function (e) {
e.preventDefault();
// ... collect all fields as before ...
const formData = new FormData(this);
const res = await fetch("/api/upload", { method: "POST", body: formData });
const data = await res.json();
if (res.ok) {
// Save data.fileUrl and other info as you need
localStorage.setItem("lastSubmission", JSON.stringify(data.submission));
alert("Uploaded successfully!");
this.reset();
} else {
alert(data.error);
}
});

text

---

## 6. `frontend/assessment.html` (Project File Viewer)

- On page load or when "Load File" is clicked, fetch the file URL for the selected student.  
- If using `localStorage` (for quick prototyping), get it from there. For production, use a DB or `/api/list` to match student info to file URL.

Example for demo:

document.getElementById("loadFileBtn").addEventListener("click", function () {
// Find student info from selection...
const lastSubmission = JSON.parse(localStorage.getItem("lastSubmission"));
if (!lastSubmission || !lastSubmission.fileUrl) {
document.getElementById("fileViewer").textContent = "No file found!";
return;
}
const viewer = document.getElementById("fileViewer");
if (lastSubmission.fileUrl.endsWith(".pdf")) {
viewer.innerHTML = <iframe src="${lastSubmission.fileUrl}#toolbar=0" width="100%" height="500px"></iframe>;
} else {
viewer.innerHTML = <a href="${lastSubmission.fileUrl}" target="_blank">Download File</a>;
}
});

text

Add a `<div id="fileViewer"></div>` where your preview should show in `assessment.html`.

---

## 7. Organize Code References

- Make sure all asset paths in HTML (`logo.PNG`, `style.css`, JS) point to the correct location in deployment (`/frontend/` or `/public/` depending on Vercel/static setup).
- On Vercel, static assets are typically in `/public`.
