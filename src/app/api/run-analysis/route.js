// 2.3.1

import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { generateProjectId, loadCounters, loadRunningTasks, saveCounters, saveRunningTasks } from '@/lib/idGenerator';

export let runningTasks = await loadRunningTasks();

export async function POST(req) {
  try {
    // Parse the request body
    const { projectName, folderName, testType ,outputDirectory ,numberOfSamples , excelSheet} = await req.json();

    // initialize the counter
    const counter = loadCounters();

    // getting the taskId/ projectId
    const taskId = generateProjectId(counter);

    // save the counter to the json file
    saveCounters(counter); // Save counter after increment

    // creating the name for the output folder
    const startTime = Date.now();
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const formattedTime = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const formattedDateTime = `${formattedDate}_${formattedTime}`;


    // selecting the input and output directories with the excel sheet
    const inputDir = path.join(os.tmpdir(), 'uploads' ,folderName);
    const outputDir = path.join(outputDirectory , formattedDateTime);

    console.log('outputDir:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });

    // Read the content of the Excel file
    // let NOS=0;
    const excelFile = path.join(inputDir, excelSheet ); // Assuming the Excel file is named 'input.xlsx'
    if (!fs.existsSync(excelFile)) {
      return NextResponse.json({ error: 'Excel file not found' }, { status: 400 });
    }
    console.log('Excel file path:', excelFile);
    
    // // count the number of samples in the excel sheet
    // NOS = sheetData.length;
    // console.log('Number of samples:', NOS); // Log the number of samples

    // making the path for the files for different testTypes
    const basePath = path.join(process.cwd(), '../fastq_to_vcf/resources');
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
        return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
    }

  // creating the script path for the bash scripts
    const scriptPath1 = path.join(process.cwd(), '../fastq_to_vcf/call_batch.sh');
    const scriptPath2 = path.join(process.cwd(), '../fastq_to_vcf/NeoVar.sh');
    const logPath = path.join(outputDir, 'output.log');

    

    // command to run the bash script
    const command = `${scriptPath1} ${scriptPath2} ${inputDir} ${outputDir} ${target} ${target_interval} > ${logPath} 2>&1 &`;
    console.log('[RUNNING COMMAND]:', command);

    // Check if the task is already running
    runningTasks[taskId] = {
      counter,
      taskId,
      projectName,
      // excelPath,
      inputDir,
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
      // excelPath,
      inputDir,
      numberOfSamples,
      testType,
      startTime,
      outputDir,
      logPath,
      status: 'running',
      done: false,
    })
    // making the command so it can run in the background
    const child = exec(command, { detached: true, stdio: 'ignore' });
    child.unref();
    

    // sending the response
    return NextResponse.json(
      { message: 'Analysis started in background', taskId, outputDir },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in run-analysis/route.js:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}