// scripts/runPipeline.js

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

// const idGenerator = require(path.resolve(__dirname, '../src/lib/idGenerator'));
// const { generateProjectId, loadCounters, loadRunningTasks, saveCounters, saveRunningTasks } = idGenerator;
import { generateProjectId, loadCounters, loadRunningTasks, saveCounters, saveRunningTasks } from '../src/lib/idGenerator.js';

const runningTasks = await loadRunningTasks();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runPipeline({
    projectName,
    folderName,
    excelPath,
    testType,
    inputDirectory,
    outputDirectory,
    numberOfSamples,
    callback,
}) {
    try {
        // initialize the counter
        console.log('running pipeline', {
            projectName,
            folderName,
            excelPath,
            testType,
            inputDirectory,
            numberOfSamples,
            outputDirectory,
        })
        const counter = loadCounters();

        // getting the taskId/ projectId
        const taskId = generateProjectId(counter);

        // save the counter to the json file
        saveCounters(counter); // Save counter after increment

        const startTime = Date.now();
        const date = new Date();
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
        const formattedTime = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
        const formattedDateTime = `${formattedDate}_${formattedTime}`;
        const outputDir = path.join(outputDirectory, formattedDateTime);

        fs.mkdirSync(outputDir, { recursive: true });

        // const workbook = XLSX.readFile(excelPath);
        // const sheetName = workbook.SheetNames[0];
        // const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
        // const numberOfSamples = sheetData.length;

        // const reader = new FileReader();
        //         reader.onload = async (ex) => {
        //             const data = new Uint8Array(excelPath);
        //             const workbook = XLSX.read(data, { type: 'array' });
        //             const sheetName = workbook.SheetNames[0];
        //             const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

        //             console.log('📊 Parsed Sheet Data:', sheetData);
        //             // setExcelData(sheetData);
        //         };

        // reader.readAsArrayBuffer(file);

        const basePath = path.join(__dirname, '../../fastq_to_vcf/resources');
        let target, target_interval;

        switch (testType) {
            case 'exome':
                target = path.join(basePath, 'Exome.hg38.target.vC1.bed');
                target_interval = path.join(basePath, 'Exome.hg38.target.vC1.interval_list');
                break;
            case 'clinical':
                target = path.join(basePath, 'UCE_hg38_v1.1.bed');
                target_interval = path.join(basePath, 'UCE_hg38_v1.1.interval_list');
                break;
            case 'carrier':
                target = path.join(basePath, 'SCR_hg38_v1.1.bed');
                target_interval = path.join(basePath, 'SCR_hg38_v1.1.interval_list');
                break;
            default:
                throw new Error('Invalid test type');
        }

        const script1 = path.join(__dirname, '../../fastq_to_vcf/call_batch.sh');
        const script2 = path.join(__dirname, '../../fastq_to_vcf/NeoVar.sh');
        const logPath = path.join(outputDir, 'output.log');

        const command = `${script1} ${script2} ${inputDirectory} ${outputDir} ${target} ${target_interval} > ${logPath} 2>&1`;

        console.log('[RUNNING COMMAND]:', command);

        const child = spawn('/bin/bash', ['-c', command], { detached: true });

        child.stdout.on('data', (data) => {
            console.log(`STDOUT: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`STDERR: ${data}`);
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log('✅ Pipeline completed successfully.');
                callback({
                    success: true,
                    outputDir,
                    logPath,
                    numberOfSamples,
                    taskId,
                });
            } else {
                console.error(`❌ Pipeline exited with code ${code}`);
                callback({ success: false, error: `Pipeline exited with code ${code}` });
            }
        });

        child.unref();

        console.log('✅ Pipeline running in the background...');
        callback({
            success: true,
            outputDir,
            logPath,
            numberOfSamples,
            taskId,
        });
        // const command = 'echo "Hello, World!"';
        // exec(command, (error, stdout, stderr) => {
        //     if (error) {
        //         console.error('❌ Pipeline Error:', error.message);
        //         return;
        //     }

        //     console.log('✅ Command Output:', stdout);
        //     callback({
        //         success: true,
        //         outputDir,
        //         logPath,
        //         numberOfSamples,
        //     });
        // });
        runningTasks[taskId] = {
            counter,
            taskId,
            projectName,
            excelPath,
            inputDirectory,
            numberOfSamples,
            testType,
            startTime,
            outputDir,
            logPath,
            status: 'running',
            done: false,
        };

        // Save the running task to the JSON file
        saveRunningTasks({
            taskId,
            projectName,
            excelPath,
            inputDirectory,
            numberOfSamples,
            testType,
            startTime,
            outputDir,
            logPath,
            status: 'running',
            done: false,
        })
    } catch (err) {
        console.error('❌ Exception:', err.message);
        callback({ success: false, error: err.message });
    }
}