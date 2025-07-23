// v3.2.0

import { NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Readable } from 'stream';
import formidable from 'formidable';
import * as XLSX from 'xlsx';
import db from '@/lib/db';

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
    const matchIds = [];
    const nodeRequest = toNodeRequest(request); // stream + headers
    // const {inputDirectory} = await request.json();
    // let response;


    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({
        multiples: true,
        keepExtensions: true,
        maxTotalFileSize: 150 * 1024 * 1024 * 1024, // 150GB
        maxFileSize: 150 * 1024 * 1024 * 1024, // 150GB
      });

      form.parse(nodeRequest, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });
    const email = fields.email[0];
    console.log('email:', email);

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
    //console.log('uploadDir:', uploadDir);

    const fileList = Array.isArray(files.file) ? files.file : [files.file];

    const referenceSampleIds = [];
    let result = [];
    // Phase 1: Process Excel files first
    for (const file of fileList) {
      const destPath = path.join(uploadDir, path.basename(file.originalFilename || 'default'));
      const lowerCaseDestPath = destPath.toLowerCase();

      if (lowerCaseDestPath.endsWith('.xls') || lowerCaseDestPath.endsWith('.xlsx')) {
        try {
          fs.copyFileSync(file.filepath, destPath);
          // console.log('Excel copied to:', destPath);
          const fileBuffer = fs.readFileSync(destPath);
          const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
          const sheetName = workbook.SheetNames[0];
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
          const numberofsamples = sheetData.length;
          if (numberofsamples > 25) {
            result.push({
              message: `You can only upload 25 samples at a time`,
              status: 400,
            })
            return NextResponse.json(result);
          }
          const fastqFiles = fileList.filter(file =>
            file.originalFilename.toLowerCase().endsWith('.fastq') ||
            file.originalFilename.toLowerCase().endsWith('.fastq.gz') ||
            file.originalFilename.toLowerCase().endsWith('.fq') ||
            file.originalFilename.toLowerCase().endsWith('.fq.gz')
          );

          if (numberofsamples !== fastqFiles.length) {
            result.push({
              message: `Number of samples in Excel (${numberofsamples}) does not match number of FASTQ files (${fastqFiles.length})`,
              status: 400,
            });
            return NextResponse.json(result);
          }
          const credits = await db.query('SELECT credits from register_data where email = $1', [email]);
          const counter = credits.rows[0].credits;
          if (counter < numberofsamples) {
            result.push({
              message: `You have ${counter} Counters left`,
              status: 400,
            })
          }
          else {
            db.query('UPDATE register_data SET credits = $1 WHERE email = $2', [counter - numberofsamples, email]);
          }

          const sampleIds = sheetData
            // .map(row => row['Sample ID']?.toString().trim())
            .map(row => {
              const rawId = row['Sample ID']?.toString().trim().normalize();
              return rawId?.replace(/(_R[12]|_[12])$/, ''); // Normalize here!
            })
            .filter(Boolean);

          referenceSampleIds.push(...sampleIds);
          //console.log('Extracted Sample IDs:', referenceSampleIds);
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
    };

    // Phase 2: Process FASTQ files with populated referenceSampleIds

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

            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

            const targetPath = path.join(uploadDir, path.basename(destPath));
            fs.copyFileSync(destPath, targetPath);

            // console.log(`✅ File copied to input directory: ${targetPath}`);
            // console.log('matchIds:', matchIds);
            result.push({
              message: `${file.originalFilename} copied to input directory`,
              status: 200,
              inputDir: uploadDir,
              filePath: targetPath,
              sampleId: matchedId
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