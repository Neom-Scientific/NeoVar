// v3.2.0

import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import formidable from 'formidable';

export const config = {
  api: {
    bodyParser: false,
  },
};

// Helper: Convert Fetch API request to Node-compatible stream
function toNodeRequest(request) {
  const readable = Readable.from(request.body);
  return Object.assign(readable, {
    headers: Object.fromEntries(request.headers), // <- manually provide headers
  });
}

export async function POST(request) {


  try {
    const nodeRequest = toNodeRequest(request); // stream + headers
    const {inputDirectory} = await request.json();

    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({
        multiples: true,
        uploadDir: inputDirectory,
        keepExtensions: true,
        maxTotalFileSize: 5 * 1024 * 1024 * 1024, // 5GB
        maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      });

      form.parse(nodeRequest, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const tempDir = path.join(os.tmpdir(), 'uploads');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Create a single upload directory for the session
const folderName = path.dirname(files.file[0].originalFilename);
// const uploadDir = path.join(tempDir, folderName);
if(!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
console.log('uploadDir:', uploadDir);

const fileList = Array.isArray(files.file) ? files.file : [files.file];
fileList.forEach(file => {
  const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));
  try {
    fs.copyFileSync(file.filepath, destPath);
    console.log('File copied successfully:', destPath);
    fs.unlinkSync(file.filepath);
  } catch (error) {
    console.error('Error during file operation:', error);
    throw error;
  }
});

    const response = new NextResponse({ message: 'file uploaded successfully', status: 200 });

    return response;
  }
  catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}


// // v3.1.0

// import { NextResponse } from 'next/server';
// import { spawn } from 'child_process';
// import fs from 'fs';
// import os from 'os';
// import path from 'path';
// import { Readable } from 'stream';
// import archiver from 'archiver';
// import { IncomingForm } from 'formidable';

// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// function toNodeReadableStream(request) {
//   return Readable.from(request.body);
// }

// export async function POST(request) {
//   const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'input-'));
//   const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'output-'));

//   try {
//     const stream = toNodeReadableStream(request);

//     const { fields, files } = await new Promise((resolve, reject) => {
//       const form = new IncomingForm({
//         multiples: true,
//         uploadDir: inputDir,
//         keepExtensions: true,
//       });

//       form.parse(stream, (err, fields, files) => {
//         if (err) reject(err);
//         else resolve({ fields, files });
//       });
//     });

//     console.log('Fields:', fields);
//     console.log('Files:', files);
//     console.log('inputDir:', inputDir);
//     console.log('outputDir:', outputDir);
//     // const { target, targetInterval } = fields;

//     // const fileList = Array.isArray(files.file) ? files.file : [files.file];
//     // fileList.forEach(file => {
//     //   const destPath = path.join(inputDir, file.originalFilename);
//     //   fs.renameSync(file.filepath, destPath);
//     // });

//     // const script = spawn('./yourMainScript.sh', [
//     //   './script1.sh',
//     //   './script2.sh',
//     //   inputDir,
//     //   outputDir,
//     //   target,
//     //   targetInterval
//     // ]);

//     // let stderr = '';
//     // await new Promise((resolve, reject) => {
//     //   script.stderr.on('data', (data) => stderr += data.toString());
//     //   script.on('close', (code) => {
//     //     if (code !== 0) reject(stderr);
//     //     else resolve();
//     //   });
//     // });

//     // const archive = archiver('zip');
//     // const streamOutput = new Readable().wrap(archive);

//     // fs.readdirSync(outputDir).forEach(file => {
//     //   const fullPath = path.join(outputDir, file);
//     //   archive.file(fullPath, { name: file });
//     // });
//     // archive.finalize();

//     // const headers = new Headers();
//     // headers.set('Content-Type', 'application/zip');
//     // headers.set('Content-Disposition', 'attachment; filename="results.zip"');

//     // const response = new NextResponse(streamOutput, { status: 200, headers });

//     const response = new NextResponse({ message: 'file uploaded successfully', status: 200 });
//     // streamOutput.on('end', () => {
//     //   fs.rmSync(inputDir, { recursive: true, force: true });
//     //   fs.rmSync(outputDir, { recursive: true, force: true });
//     // });

//     return response;
//   } catch (error) {
//     fs.rmSync(inputDir, { recursive: true, force: true });
//     fs.rmSync(outputDir, { recursive: true, force: true });
//     return NextResponse.json({ error: error.toString() }, { status: 500 });
//   }
// }


// // v3.0.0
// import { NextResponse } from 'next/server';
// import { spawn } from 'child_process';
// import fs from 'fs';
// import os from 'os';
// import path from 'path';
// import { Readable } from 'stream';
// import archiver from 'archiver';
// import { IncomingForm } from 'formidable';

// // Disable body parser for file upload
// export const config = {
//   api: {
//     bodyParser: false,
//   },
// };

// export async function POST(req) {
//   const inputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'input-'));
//   const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), 'output-'));

//   try {
//     // 1. Parse incoming form data
//     const { fields, files } = await new Promise((resolve, reject) => {
//       const form = new IncomingForm({ multiples: true, uploadDir: inputDir, keepExtensions: true });
//       form.parse(req, (err, fields, files) => {
//         if (err) reject(err);
//         else resolve({ fields, files });
//       });
//     });

//     console.log('Fields:', fields);
//     console.log('Files:', files);

//     // const { target, targetInterval } = fields;

//     // // 2. Rename uploaded files to original filenames
//     // const fileList = Array.isArray(files.file) ? files.file : [files.file];
//     // fileList.forEach(file => {
//     //   const destPath = path.join(inputDir, file.originalFilename);
//     //   fs.renameSync(file.filepath, destPath);
//     // });

//     // // 3. Run the bash script
//     // const script = spawn('./yourMainScript.sh', [
//     //   './script1.sh',
//     //   './script2.sh',
//     //   inputDir,
//     //   outputDir,
//     //   target,
//     //   targetInterval
//     // ]);

//     // let stderr = '';
//     // await new Promise((resolve, reject) => {
//     //   script.stderr.on('data', (data) => stderr += data.toString());
//     //   script.on('close', (code) => {
//     //     if (code !== 0) reject(stderr);
//     //     else resolve();
//     //   });
//     // });

//     // // 4. Zip output folder to stream
//     // const archive = archiver('zip');
//     // const zipStream = new Readable().wrap(archive);

//     // fs.readdirSync(outputDir).forEach(file => {
//     //   const fullPath = path.join(outputDir, file);
//     //   archive.file(fullPath, { name: file });
//     // });
//     // archive.finalize();

//     // // 5. Prepare NextResponse stream
//     // const headers = new Headers();
//     // headers.set('Content-Type', 'application/zip');
//     // headers.set('Content-Disposition', 'attachment; filename="results.zip"');

//     // const response = new NextResponse(zipStream, { status: 200, headers });

//     const response = new NextResponse({message:'file uploaded successfully', status: 200 });

//     // // 6. Clean up after stream ends
//     // zipStream.on('end', () => {
//     //   fs.rmSync(inputDir, { recursive: true, force: true });
//     //   fs.rmSync(outputDir, { recursive: true, force: true });
//     // });

//     return response;
//   } catch (error) {
//     fs.rmSync(inputDir, { recursive: true, force: true });
//     fs.rmSync(outputDir, { recursive: true, force: true });
//     return NextResponse.json({ error: error.toString() }, { status: 500 });
//   }
// }


// // import formidable from 'formidable';
// // import fs from 'fs';
// // import path from 'path';
// // import { NextResponse } from 'next/server';
// // import { Readable } from 'stream';

// // export const config = {
// //   api: {
// //     bodyParser: false,
// //   },
// // };

// // function convertToNodeReadable(req) {
// //   const reader = req.body.getReader();
// //   return Readable.from((async function* () {
// //     while (true) {
// //       const { done, value } = await reader.read();
// //       if (done) break;
// //       yield value;
// //     }
// //   })());
// // }

// // function convertHeaders(headers) {
// //   const result = {};
// //   for (const [key, value] of headers.entries()) {
// //     result[key.toLowerCase()] = value;
// //   }
// //   return result;
// // }

// // export async function POST(req) {
// //   try {
// //     const nodeReq = convertToNodeReadable(req);
// //     nodeReq.headers = convertHeaders(req.headers);

// //     let projectName = 'default_project'; // Fallback if no project name is provided

// //     const form = formidable({
// //       multiples: true, // Allow multiple file uploads
// //       keepExtensions: true, // Keep the original file extensions
// //       maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
// //     });

// //     // Listen to field event to get project name early
// //     form.on('field', (name, value) => {
// //       if (name === 'project') {
// //         projectName = value;
// //       }
// //     });

// //     // Set file destination dynamically before each file is saved
// //     form.on('fileBegin', (name, file) => {
// //       const folderName = path.dirname(file.originalFilename);
// //       const uploadDir = path.join(process.cwd(), 'uploads', folderName);
// //       fs.mkdirSync(uploadDir, { recursive: true });
// //       const fileName = path.basename(file.originalFilename);
// //       const newFilePath = path.join(uploadDir, fileName || file.newFilename);
// //       file.filepath = newFilePath; // Override the path
// //     });

// //     const { fields, files } = await new Promise((resolve, reject) => {
// //       form.parse(nodeReq, (err, fields, files) => {
// //         if (err) return reject(err);
// //         resolve({ fields, files });
// //       });
// //     });
// //     console.log('Fields:', fields);
// //     console.log('Files:', files);

// //     // Dynamically set the project directory
// //     const projectDir = path.join(process.cwd(), 'uploads', projectName);
// //     fs.mkdirSync(projectDir, { recursive: true });


// //     return NextResponse.json({ message: 'Files uploaded successfully' }, { status: 200 });
// //   } catch (error) {
// //     console.error('File upload failed:', error);
// //     return new NextResponse(JSON.stringify({ message: 'File upload failed' }), {
// //       status: 500,
// //     });
// //   }
// // }