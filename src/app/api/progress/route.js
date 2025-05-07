// v3.0

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import {
  deleteRunningTask,
  loadRunningTasks,
  saveProjectDetails,
  saveRunningTasks,
} from '@/lib/idGenerator';
import db from '@/lib/db';

// Ordered steps for progress tracking
const progressSteps = [
  "Mapping reads with BWA-MEM, sorting",
  "Running QC analysis",
  "Mean Quality by Cycle",
  "Quality Score Distribution",
  "GC Bias Metrics",
  "Insert Size Metrics",
  "Alignment Statistics",
  "Remove Duplicate Reads",
  "Running Coverage",
  "Variant calling",
  "Variant Filtering",
  "VCF filtering completed"
];

export async function POST(req) {
  try {
    const { taskId, email } = await req.json();
    // // console.log('taskId:', taskId);

    // Load task from JSON file (persistent)
    // const allTasks = await loadRunningTasks();
    // const task = allTasks[taskId];
    const task = await db.query('SELECT * FROM RunningTasks WHERE projectid = $1', [taskId]);
    // console.log('task:', task.rows);

    if (task.rowCount === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 200 });
    }

    const logPath = task.rows[0].logpath;
    const startTime = task.rows[0].starttime;


    // Read the log file
    let logContent = '';
    try {
      logContent = fs.readFileSync(logPath, 'utf8');
    } catch {
      return NextResponse.json({
        progress: 0,
        status: 'initializing',
        eta: 'Calculating...',
      });
    }

    // Determine progress step
    let currentStep = -1;
    for (let i = progressSteps.length - 1; i >= 0; i--) {
      if (logContent.includes(progressSteps[i])) {
        currentStep = i;
        break;
      }
    }

    const totalSteps = progressSteps.length;
    const progress = Math.floor(((currentStep + 1) / totalSteps) * 100);

    // If task is completed
    if (currentStep === totalSteps - 1 && !task.done) {
      task.done = true;
      task.progress = 100;
      task.status = 'done';

      // Save project details
      // saveProjectDetails({
      //   counter: task.counter,
      //   projectId: task.taskId,
      //   projectName: task.projectName,
      //   analysisStatus: 'done',
      //   creationTime: startTime,
      //   operation: 'analysis',
      //   progress: 100,
      //   numberOfSamples: task.numberOfSamples,
      //   totalTime: Date.now() - startTime,
      // });

      const counterData = await db.query('INSERT INTO CounterTasks (projectid, projectname, analysistatus, creationtime, progress, numberofsamples, totaltime, email) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [
        task.rows[0].projectid,
        task.rows[0].projectname,
        'done',
        task.rows[0].starttime,
        100,
        task.rows[0].numberofsamples,
        Date.now() - startTime,
        email
      ]);
      // console.log('counterData:', counterData.rows);

      // Cleanup temp files
      if (fs.existsSync(task.inputDir)) {
        fs.rmSync(task.inputDir, { recursive: true, force: true });
      }
      // if (fs.existsSync(task.excelPath)) {
      //   fs.rmSync(task.excelPath, { recursive: true, force: true });
      // }

      // Delete task from disk
      db.query(
        'DELETE FROM RunningTasks WHERE projectid = $1',
        [taskId]
      );
      // deleteRunningTask(taskId);

      return NextResponse.json({
        taskId,
        projectName: task.projectName,
        numberOfSamples: task.numberOfSamples,
        startTime,
        progress: 100,
        status: 'done',
        eta: 'Completed',
      });
    }

    // Update progress in the file if changed

    if (task.progress == null || task.progress !== progress) {
      task.progress = progress;
      task.status = 'in progress';
      task.done = false;

      // await saveRunningTasks(task);
      // console.log('progress:', progress);
      // console.log('status:', task.status);
      // console.log('task.projectid:', taskId);
      const progressData = await db.query(
        'UPDATE RunningTasks SET progress = $1, status = $2 WHERE projectid = $3',
        [progress, task.status, taskId]
      );
      // console.log('progress:', progressData.rows);
    }

    // Estimate ETA
    const elapsed = Date.now() - startTime;
    const remainingMinutes = Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000));

    return NextResponse.json({
      taskId,
      projectName: task.rows[0].projectname,
      numberOfSamples: task.rows[0].numberofsamples,
      startTime: parseInt(task.rows[0].starttime),
      progress,
      status: 'in progress',
      inputDir: task.rows[0].inputdir,
      outputDir: task.rows[0].outputdir,
      testtype: task.rows[0].testtype,
      eta: `${remainingMinutes} minute(s) left`,
    });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}