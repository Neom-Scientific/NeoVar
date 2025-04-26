// 2.3.1

import { exec } from 'child_process';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { generateProjectId, loadCounters, loadRunningTasks, saveCounters, saveRunningTasks } from '@/lib/idGenerator';
import db from '@/lib/db';


export let runningTasks = await loadRunningTasks();

export async function POST(req) {
  try {
    // Parse the request body
    const { projectName, testType, outputDirectory, numberOfSamples, excelSheet, inputDir, localDir ,email } = await req.json();

    // initialize the counter
    let taskId;
    const getRunningTasks = await db.query('SELECT email from RunningTasks WHERE email = $1', [email]);
    const getCounterTasks = await db.query('SELECT email from CounterTasks WHERE email = $1', [email]);
    // if (getRunningTasks.rowCount > 0) {
    //   // Check if the task is already running
    //   const length = getRunningTasks.rows.length;
    //   taskId = generateProjectId(length);
    // }
    // else{
    //   taskId = generateProjectId();
    // }
    if(getCounterTasks.rowCount === 0 && getRunningTasks.rowCount === 0 ){
      taskId= generateProjectId();
    }
    else if(getCounterTasks.rowCount > 0){
      const length = getCounterTasks.rows.length;
      taskId = generateProjectId(length);
    }


    console.log('taskId:', taskId);
    // creating the name for the output folder
    const startTime = Date.now();
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    const formattedTime = `${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}`;
    const formattedDateTime = `${formattedDate}_${formattedTime}`;


    // selecting the input and output directories with the excel sheet
    // const outputDir = path.join(outputDirectory, formattedDateTime);

    const outputDir="/media/strive/Strive/NewFolder2/2025-4-25_13-8-48"

    // console.log('outputDir:', outputDir);
    fs.mkdirSync(outputDir, { recursive: true });

    // Read the content of the Excel file
    const excelFile = path.join(inputDir, excelSheet); // Assuming the Excel file is named 'input.xlsx'
   
    if (!fs.existsSync(excelFile)) {
      return NextResponse.json({ error: 'Excel file not found' }, { status: 400 });
    }

    // making the path for the files for different testTypes
    const basePath = path.join(process.cwd(), './scripts/resources');
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
    const scriptPath1 = path.join(process.cwd(), './scripts/call_batch.sh');
    const scriptPath2 = path.join(process.cwd(), './scripts/NeoVar.sh');
    const logPath = path.join(outputDir, 'output.log');

    let counter;
    let length;
    if(getCounterTasks.rowCount === 0 && getRunningTasks.rowCount === 0){
      counter = 0;
      counter += numberOfSamples;
      console.log('counter:', counter);
    }
    else if(getCounterTasks.rowCount > 0){
      counter = await db.query('SELECT counter FROM CounterTasks WHERE email = $1', [email]);
      length = getCounterTasks.rowCount;
      console.log('counter:', counter.rows);
      console.log('length:', length);
      counter = counter.rows[length-1].counter;
      console.log('counter:', counter);
      counter += numberOfSamples;
      console.log('counter:', counter);
    }
    // if(getRunningTasks.rowCount > 0){
    //   counter = await db.query('SELECT counter FROM RunningTasks WHERE email = $1', [email]);
    //   console.log('counter:', counter);
    //   counter = counter.rows[0].counter;
    //   console.log('counter:', counter);
    //   counter += numberOfSamples;
    //   console.log('counter:', counter);
    // }
    // else{
    //   counter=0;
    //   counter += numberOfSamples;
    //   console.log('counter:', counter);
    // }


    // command to run the bash script
    if(getCounterTasks.rows[length-1].counter <= 100){
      const command = `${scriptPath1} ${scriptPath2} ${inputDir} ${outputDir} ${target} ${target_interval} ${localDir} > ${logPath} 2>&1 &`;
    }
    else{
      return NextResponse.json({ message: 'You have reached the maximum number of samples' }, { status: 400 });
    }

    // Check if the task is already running
    runningTasks[taskId] = {
      counter,
      taskId,
      projectName,
      inputDir,
      numberOfSamples,
      testType,
      startTime,
      outputDir,
      logPath,
      status: 'running',
      done: false,
    };
    console.log('runningTasks:', runningTasks[taskId]);

    const runningTasksData = await db.query(
      'INSERT INTO RunningTasks (projectid , projectname , inputdir , outputdir , logpath ,numberofsamples , testtype, status, done , email, starttime, counter) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [
        taskId,
        projectName,
        inputDir,
        outputDir,
        logPath,
        numberOfSamples,
        testType,
        'running',
        false,
        email,
        startTime,  
        counter
      ]
    );
    console.log('runningTasksData:', runningTasksData.rows);
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