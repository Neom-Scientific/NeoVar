// v3.2.0

import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import formidable from 'formidable';
import * as XLSX from 'xlsx';

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
    // const {inputDirectory} = await request.json();
    // let response;


    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({
        multiples: true,
        keepExtensions: true,
        maxTotalFileSize: 150 * 1024 * 1024 * 1024, // 5GB
        maxFileSize: 150 * 1024 * 1024 * 1024, // 5GB
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
    
    const folderName = path.dirname(files.file[1].originalFilename);
    const uploadDir = path.join(tempDir, folderName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    // console.log('uploadDir:', uploadDir);

    const fileList = Array.isArray(files.file) ? files.file : [files.file];

    const referenceSampleIds = [];

    // Phase 1: Process Excel files first
    fileList.forEach((file) => {
      const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));
      const lowerCaseDestPath = destPath.toLowerCase();

      if (lowerCaseDestPath.endsWith('.xls') || lowerCaseDestPath.endsWith('.xlsx')) {
        try {
          fs.copyFileSync(file.filepath, destPath);
          console.log('Excel copied to:', destPath);
          const fileBuffer = fs.readFileSync(destPath);
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

          const sampleIds = sheetData
            // .map(row => row['Sample ID']?.toString().trim())
            .map(row => {
              const rawId = row['Sample ID']?.toString().trim().normalize();
              return rawId?.replace(/(_R[12]|_[12])$/, ''); // Normalize here!
            })
            .filter(Boolean);

          referenceSampleIds.push(...sampleIds);
          // console.log('Extracted Sample IDs:', referenceSampleIds);
        } catch (err) {
          console.error('Error processing Excel file:', err);
        } finally {
          try {
            fs.unlinkSync(file.filepath);
          } catch (err) {
            console.warn('Temp file deletion failed:', err.message);
          }
        }
      }
    });

    // Phase 2: Process FASTQ files with populated referenceSampleIds
    let result = [];
    for (const file of fileList) {
      const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));
      const lowerCaseDestPath = destPath.toLowerCase();

      if (
        lowerCaseDestPath.endsWith('.fastq') ||
        lowerCaseDestPath.endsWith('.fastq.gz') ||
        lowerCaseDestPath.endsWith('.fq') ||
        lowerCaseDestPath.endsWith('.fq.gz')
      ) {
        try {
          fs.copyFileSync(file.filepath, destPath);

          // Extract baseName and normalize it
          let baseName = path.basename(file.originalFilename || '').replace(/\.(fastq|fq)(\.gz)?$/i, '');
          baseName = baseName.replace(/(_R[12]|_[12])$/, '').trim().normalize();

          // Normalize referenceSampleIds and find a match
          let normalizedId;
          // console.log('Looking for match for:', baseName);
          // console.log('In sample IDs:', referenceSampleIds);
          const matchedId = referenceSampleIds.find((id) => {
            // console.log('Matching baseName:', baseName);
            normalizedId = id.replace(/(_R[12]|_[12])$/, '');
            return baseName === normalizedId; // Use exact matching
          });

          if (matchedId) {
            console.log(`✅ File "${file.originalFilename}" matches Sample ID: ${matchedId}`);

            // const inputDir = path.join('/tmp/input'); // or use a dynamic path if needed
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const targetPath = path.join(uploadDir, path.basename(destPath));
            fs.copyFileSync(destPath, targetPath);

            console.log(`✅ File copied to input directory: ${targetPath}`);
            result.push({
              message: `${file.originalFilename} copied to input directory`,
              status: 200,
              inputDir: uploadDir,
              filePath: targetPath,
            });
          } else {
            console.error(`❌ File "${file.originalFilename}" does not match any Sample ID from Excel.`);
            fs.unlinkSync(destPath);

            result.push({
              message: `${file.originalFilename} does not match from Excel`,
              status: 400,
              filePath: destPath,
            });
          }
        } catch (error) {
          console.error('Error processing FASTQ file:', error);
        } finally {
          try {
            fs.unlinkSync(file.filepath);
          } catch (err) {
            console.warn('Temp file deletion failed:', err.message);
          }
        }
      }
    }




    return NextResponse.json(result);
  }
  catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}

// for (const file of fileList) {
//   const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));
//   const lowerCaseDestPath = destPath.toLowerCase();

//   if (
//     lowerCaseDestPath.endsWith('.fastq') ||
//     lowerCaseDestPath.endsWith('.fastq.gz') ||
//     lowerCaseDestPath.endsWith('.fq') ||
//     lowerCaseDestPath.endsWith('.fq.gz')
//   ) {
//     try {
//       for (let i = 0; i <= fileList.length; i++) {
//         fs.copyFileSync(file.filepath, destPath);
//         let baseName = path.basename(file.originalFilename || '').split('.')[0];
//         baseName = baseName.replace(/(_R[12]|_[12])$/, ''); // Remove _R1, _R2, or _1, _2

//         console.log('basename:', baseName);

//         const matchedId = referenceSampleIds.find(id =>
//           baseName.includes(id)
//         );


//         if (matchedId) {
//           // const inputDir = path.join('/tmp/input');
//           if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
//           const targetPath = path.join(uploadDir, path.basename(destPath));
//           fs.copyFileSync(destPath, targetPath);
//           console.log(`✅ File copied to input directory: ${targetPath}`);
//           // response = new NextResponse({ message: `${file.originalFilename} copied to input directory`, status: 200 });
//           result.push({
//             message: `${file.originalFilename} copied to input directory`,
//             status: 200,
//             inputDir: uploadDir,
//             filePath: targetPath,
//           })
//         } else {
//           console.error(`❌ File "${file.originalFilename}" does not match any Sample ID from Excel.`);
//           fs.unlinkSync(destPath);
//           // response = new NextResponse({ message: `${file.originalFilename} does not match from Excel`, status: 400 });
//           result.push({
//             message: `${file.originalFilename} does not match from Excel`,
//             status: 400,
//             filePath: destPath,
//           })
//         }
//       }
//     } catch (error) {
//       console.error('Error processing FASTQ file:', error);
//     } finally {
//       try {
//         fs.unlinkSync(file.filepath);
//       } catch (err) {
//         console.warn('Temp file deletion failed:', err.message);
//       }
//     }
//   }
// }

// fileList.forEach(file => {
//   const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));

//   // Normalize the case for comparison
//   const lowerCaseDestPath = destPath.toLowerCase();
//   // Check for both .xls and .xlsx extensions

//   try {
//     fs.copyFileSync(file.filepath, destPath);
//     console.log('File copied:', destPath);

//     if (lowerCaseDestPath.endsWith('.xls') || lowerCaseDestPath.endsWith('.xlsx')) {
//       if (!fs.existsSync(destPath)) {
//         console.error('Excel file does not exist:', destPath);
//         return;
//       }

//       const fileBuffer = fs.readFileSync(destPath);

//       try {
//         const workbook = XLSX.read(fileBuffer, { type: 'buffer' }); // better than `readFile()`
//         const sheetName = workbook.SheetNames[0];
//         const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
//         console.log('Excel Data:', sheetData);
//       } catch (err) {
//         console.error('XLSX.read buffer failed:', err);
//       }

//       const header = fileBuffer.subarray(0, 8).toString('hex');

//     }
//   } catch (error) {
//     console.error('Error handling Excel file:', error);
//   } finally {
//     try {
//       fs.unlinkSync(file.filepath); // Only delete temp if safe
//     } catch (err) {
//       console.warn('Temp file deletion failed:', err.message);
//     }
//   }

// });

// const response = new NextResponse({ message: 'file uploaded successfully', status: 200 });