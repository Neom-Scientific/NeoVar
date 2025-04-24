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

    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({
        multiples: true,
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
    const uploadDir = path.join(tempDir, folderName);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log('uploadDir:', uploadDir);

    const fileList = Array.isArray(files.file) ? files.file : [files.file];

    const referenceSampleIds = [];

    fileList.forEach((file, index) => {
      const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));

      try {
        fs.copyFileSync(file.filepath, destPath);
        console.log('File copied to temp upload dir:', destPath);

        const lowerCaseDestPath = destPath.toLowerCase();

        if (lowerCaseDestPath.endsWith('.xls') || lowerCaseDestPath.endsWith('.xlsx')) {
          const fileBuffer = fs.readFileSync(destPath);

          try {
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
            const numberOfSamples = sheetData.length;

            const sampleIds = sheetData
              .map(row => row['Sample ID']?.toString().trim())
              .filter(Boolean);

            referenceSampleIds.push(...sampleIds);
            console.log('Extracted Sample IDs:', referenceSampleIds);
          } catch (err) {
            console.error('Error reading Excel file:', err);
          }
        } else if (
          lowerCaseDestPath.endsWith('.fastq') ||
          lowerCaseDestPath.endsWith('.fastq.gz') ||
          lowerCaseDestPath.endsWith('.fq') ||
          lowerCaseDestPath.endsWith('.fq.gz')
        ) {
          const baseName = path.basename(file.originalFilename || '').toLowerCase();
          const matchedId = referenceSampleIds.find(id =>
            baseName.includes(id.toLowerCase())
          );

          if (matchedId) {
            console.log(`✅ File "${file.originalFilename}" matches Sample ID: ${matchedId}`);

            // Now move/copy to input directory
            const inputDir = path.join('/tmp/input'); // Change to your actual input path
            if (!fs.existsSync(inputDir)) fs.mkdirSync(inputDir, { recursive: true });

            const targetPath = path.join(inputDir, path.basename(destPath));
            fs.copyFileSync(destPath, targetPath);
            console.log(`✅ File copied to input directory: ${targetPath}`);
            const response= new NextResponse({ message: `${file.originalFilename} copied to input directory`, status: 200 });
            return response;
          } else {
            console.error(`❌ File "${file.originalFilename}" does not match any Sample ID from Excel.`);
            fs.unlinkSync(destPath); // Clean up temp file
            const response= new NextResponse({ message: `${file.originalFilename} does not match from Excel`, status: 400 });
            return response;
            // Optional: throw error or push to error array if you want to respond later
          }
        }
      } catch (error) {
        console.error('Error processing file:', error);
      } finally {
        try {
          fs.unlinkSync(file.filepath); // Always clean up temp
        } catch (err) {
          console.warn('Temp file deletion failed:', err.message);
        }
      }
    });

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

    const response = new NextResponse({ message: 'file uploaded successfully', status: 200 });

    return response;
  }
  catch (err) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
  }
}