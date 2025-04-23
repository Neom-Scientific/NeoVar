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
    const { taskId } = await req.json();
    console.log('taskId:', taskId);

    // Load task from JSON file (persistent)
    const allTasks = await loadRunningTasks();
    const task = allTasks[taskId];

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const { logPath, startTime } = task;
    console.log('logPath:', logPath);
    console.log('startTime:', startTime);

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
      await saveProjectDetails({
        counter: task.counter,
        projectId: task.taskId,
        projectName: task.projectName,
        analysisStatus: 'done',
        creationTime: startTime,
        operation: 'analysis',
        progress: 100,
        numberOfSamples: task.numberOfSamples,
        totalTime: Date.now() - startTime,
      });

      // Cleanup temp files
      if (fs.existsSync(task.inputDir)) {
        fs.rmSync(task.inputDir, { recursive: true, force: true });
      }
      // if (fs.existsSync(task.excelPath)) {
      //   fs.rmSync(task.excelPath, { recursive: true, force: true });
      // }

      // Delete task from disk
      await deleteRunningTask(taskId);

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
    if (!task.progress || task.progress !== progress) {
      task.progress = progress;
      task.status = 'in progress';
      task.done = false;

      await saveRunningTasks(task);
    }

    // Estimate ETA
    const elapsed = Date.now() - startTime;
    const remainingMinutes = Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000));

    return NextResponse.json({
      taskId,
      projectName: task.projectName,
      numberOfSamples: task.numberOfSamples,
      startTime,
      progress,
      status: 'in progress',
      eta: `${remainingMinutes} minute(s) left`,
    });
  } catch (error) {
    console.error('Progress error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// // v2.3
// import { NextResponse } from 'next/server';
// import fs from 'fs';
// import { runningTasks } from '../run-analysis/route';
// import {
//   deleteRunningTask,
//   loadRunningTasks,
//   saveProjectDetails,
//   saveRunningTasks,
// } from '@/lib/idGenerator';

// // Ordered steps for progress tracking
// const progressSteps = [
//   "Mapping reads with BWA-MEM, sorting",
//   "Running QC analysis",
//   "Mean Quality by Cycle",
//   "Quality Score Distribution",
//   "GC Bias Metrics",
//   "Insert Size Metrics",
//   "Alignment Statistics",
//   "Remove Duplicate Reads",
//   "Running Coverage",
//   "Variant calling",
//   "Variant Filtering",
//   "VCF filtering completed"
// ];

// export async function POST(req) {
//   try {
//     const { taskId } = await req.json();
//     const task = runningTasks[taskId];

//     // Handle missing task
//     if (!task) {
//       return NextResponse.json({ error: 'Task not found' }, { status: 404 });
//     }

//     const { logPath, startTime } = task;

//     // Read the log file content
//     let logContent = '';
//     try {
//       logContent = fs.readFileSync(logPath, 'utf8');
//     } catch {
//       return NextResponse.json({
//         progress: 0,
//         status: 'initializing',
//         eta: 'Calculating...'
//       });
//     }

//     // Find current step based on log file
//     let currentStep = -1;
//     for (let i = progressSteps.length - 1; i >= 0; i--) {
//       if (logContent.includes(progressSteps[i])) {
//         currentStep = i;
//         break;
//       }
//     }

//     const totalSteps = progressSteps.length;
//     const progress = Math.floor(((currentStep + 1) / totalSteps) * 100);

//     // Load previous progress state from disk
//     const previousTaskData = await loadRunningTasks();
//     const prevTask = previousTaskData[taskId];

//     // If task completed
//     if (currentStep === totalSteps - 1 && !task.done) {
//       task.done = true;
//       task.progress = 100;
//       task.status = 'done';

//       // Save final project details
//       await saveProjectDetails({
//         counter: task.counter,
//         projectId: task.taskId,
//         projectName: task.projectName,
//         analysisStatus: 'done',
//         creationTime: startTime,
//         operation: 'analysis',
//         progress: 100,
//         numberOfSamples: task.numberOfSamples,
//         totalTime: Date.now() - startTime
//       });

//       // Delete files/directories (if they exist)
//       if (fs.existsSync(task.inputDir)) {
//         fs.rmSync(task.inputDir, { recursive: true, force: true });
//       }
//       if (fs.existsSync(task.excelPath)) {
//         fs.rmSync(task.excelPath, { recursive: true, force: true });
//       }

//       // Remove from in-memory runningTasks and disk
//       deleteRunningTask(taskId);

//       return NextResponse.json({
//         taskId,
//         projectName: task.projectName,
//         numberOfSamples: task.numberOfSamples,
//         startTime,
//         progress: 100,
//         status: 'done',
//         eta: 'Completed'
//       });
//     }

//     // Save progress if changed
//     if (!prevTask || prevTask.progress !== progress) {
//       await saveRunningTasks({
//         taskId: task.taskId,
//         projectName: task.projectName,
//         excelPath: task.excelPath,
//         inputDir: task.inputDir,
//         numberOfSamples: task.numberOfSamples,
//         testType: task.testType,
//         startTime: task.startTime,
//         outputDir: task.outputDir,
//         logPath: task.logPath,
//         status: 'in progress',
//         done: false,
//         progress
//       });
//     }

//     // Calculate ETA
//     const elapsed = Date.now() - startTime;
//     const remainingMinutes = Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000));

//     return NextResponse.json({
//       taskId,
//       projectName: task.projectName,
//       numberOfSamples: task.numberOfSamples,
//       startTime,
//       progress,
//       status: 'in progress',
//       eta: `${remainingMinutes} minute(s) left`
//     });
//   } catch (error) {
//     console.error('Progress error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }


// // v2.2
// import { NextResponse } from 'next/server';
// import fs from 'fs';
// import { runningTasks } from '../run-analysis/route';
// import { deleteRunningTask, loadRunningTasks, saveProjectDetails, saveRunningTasks } from '@/lib/idGenerator';

// // array for the progress steps
// const progressSteps = [
//   "Mapping reads with BWA-MEM, sorting",
//   "Running QC analysis",
//   "Mean Quality by Cycle",
//   "Quality Score Distribution",
//   "GC Bias Metrics",
//   "Insert Size Metrics",
//   "Alignment Statistics",
//   "Remove Duplicate Reads",
//   "Running Coverage",
//   "Variant calling",
//   "Variant Filtering",
//   "VCF filtering completed"
// ];

// export async function POST(req) {
//   try {
//     // Parse the request body
//     const { taskId } = await req.json();
//     const task = runningTasks[taskId];

//     const previousTask = await loadRunningTasks();
//     const prevTask = previousTask[taskId];


//     // Check if the task exists
//     if (!task) {
//       return NextResponse.json({ error: 'Task not found' }, { status: 404 });
//     }

//     const { logPath, startTime } = task;

//     // Read the log file
//     let logContent = '';
//     try {
//       logContent = fs.readFileSync(logPath, 'utf8');
//     } catch {
//       return NextResponse.json({ progress: 0, status: 'initializing', eta: 'Calculating...' });
//     }

//     // Check the log content for progress steps
//     let currentStep = -1;
//     for (let i = progressSteps.length - 1; i >= 0; i--) {
//       if (logContent.includes(progressSteps[i])) {
//         currentStep = i;
//         break;
//       }
//     }

//     // Calculate progress
//     const totalSteps = progressSteps.length;
//     const progress = Math.floor(((currentStep + 1) / totalSteps) * 100);

//     // If the task is done, update the task status
//     // and save project details
//     if (currentStep === totalSteps - 1 && !task.done) {
//       task.done = true;

//       // delete the input directory and the excel sheee
//       fs.rmSync(task.inputDir, { recursive: true, force: true });
//       fs.rmSync(task.excelPath, { recursive: true, force: true });

//       saveProjectDetails({
//         counter: task.counter,
//         projectId: taskId,
//         projectName: task.projectName,
//         analysisStatus: 'done',
//         creationTime: task.startTime,
//         operation: 'analysis',
//         progress: 100,
//         numberOfSamples: 0,
//         totalTime: Date.now() - startTime
//       });

//       deleteRunningTask(taskId);

//       // Return the final progress response
//       return NextResponse.json({
//         startTime,
//         progress: 100,
//         status: 'done',
//         eta: 'Completed'
//       });
//     }

//     if (!prevTask || prevTask.progress !== progress) {
//       await saveRunningTasks({
//         taskId: task.taskId,
//         projectName: task.projectName,
//         excelPath: task.excelPath,
//         inputDir: task.inputDir,
//         numberOfSamples: task.numberOfSamples,
//         testType: task.testType,
//         startTime: task.startTime,
//         outputDir: task.outputDir,
//         logPath: task.logPath,
//         status: task.status,
//         done: task.done,
//         progress
//       });
//     }
//     // calculate the estimated time left
//     const now = Date.now();
//     const elapsed = (now - startTime);

//     await saveRunningTasks(task);
//     // Return the progress response
//     return NextResponse.json({
//       projectName: task.projectName,
//       taskId,
//       numberOfSamples: task.numberOfSamples,
//       startTime,
//       progress,
//       status: 'in progress',
//       eta: task.done ? 'Completed' : `${Math.max(1, Math.ceil((60 * 60 * 1000 - elapsed) / 60000))} minute(s) left`,
//     });
//   } catch (error) {
//     console.error('Progress error:', error);
//     return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
//   }
// }

// // function sanitizedTask(task) {
// //   return {

// //   };
// // }