import fs from 'fs';
import path from 'path';

// couterFile.json file path
const counterFile = path.join(process.cwd(), 'counter.json');
const runningTasksFile = path.join(process.cwd(), 'runningTasks.json');

// loads the counter file 
// if it doesn't exist, it creates a new one
export function loadCounters() {
  if (!fs.existsSync(counterFile)) {
    return { projects: {}, details: [] };
  }
  const raw = fs.readFileSync(counterFile);
  return JSON.parse(raw);
}

// saves the counter to the json file
export function saveCounters(counter) {
  fs.writeFileSync(counterFile, JSON.stringify(counter, null, 2));
}

// generates a unique project ID based on the current date and a counter
export function generateProjectId(counter) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  if (!counter.projects) {
    counter.projects = {};
  }

  if (!counter.projects[date]) {
    counter.projects[date] = 1;
  } else {
    counter.projects[date] += 1;
  }

  const seq = String(counter.projects[date]).padStart(2, '0');
  return `PRJ-${date}-${seq}`;
}

// saves project details to the counter file
// if the details array doesn't exist, it creates a new one
export function saveProjectDetails({
  counter,
  projectId,
  projectName,
  analysisStatus,
  creationTime,
  operation,
  progress,
  numberOfSamples,
  totalTime
}) {
  if (!counter.details) {
    counter.details = [];
  }

  counter.details.push({
    projectId,
    projectName,
    analysisStatus,
    creationTime,
    operation,
    progress,
    numberOfSamples,
    totalTime
  });

  saveCounters(counter);
}

export async function saveRunningTasks(task) {
  try {
    // Load existing tasks
    let runningTasks = {};
    try {
      const data = fs.readFileSync(runningTasksFile, 'utf8');
      runningTasks = JSON.parse(data);
    } catch {
      // If the file doesn't exist, start with an empty object
      runningTasks = {};
    }

    // Use projectId as the key
    runningTasks[task.taskId] = {
      taskId: task.taskId,
      projectName: task.projectName,
      excelPath: task.excelPath,
      inputDir: task.inputDir,
      numberOfSamples: task.numberOfSamples,
      testType: task.testType,
      startTime: task.startTime,
      outputDir: task.outputDir,
      logPath: task.logPath,
      status: task.status,
      done: task.done,
      progress: task.progress // if you want to store it
    };;

    // Save updated tasks back to the file
    fs.writeFile(runningTasksFile, JSON.stringify(runningTasks, null, 2), (err) => {
      if (err) {
        console.error('Error saving running tasks:', err);
      }
    });
  } catch (error) {
    console.error('Error saving running tasks:', error);
  }
}

export async function loadRunningTasks() {
  try {
    const data = fs.readFileSync(runningTasksFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading running tasks:', error);
    return {}; // Return an empty object if the file doesn't exist
  }
}

// delete the task from the running tasks when it is done
export async function deleteRunningTask(taskId) {
  try {
    const runningTasks = await loadRunningTasks();
    if (runningTasks[taskId]) {
      delete runningTasks[taskId];
      fs.writeFileSync(runningTasksFile, JSON.stringify(runningTasks, null, 2));
    }
  } catch (error) {
    console.error('Error deleting running task:', error);
  }
}

await loadRunningTasks();