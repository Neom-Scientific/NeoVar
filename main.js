import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './scripts/runPipeline.js';

// Define __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Ensure this path is correct
            contextIsolation: true, // Must be true for contextBridge to work
            nodeIntegration: false, // Must be false for security
        },
    });

    // Load your Next.js frontend (dev or build)
    win.loadURL('http://localhost:3000');
}

// Handle events from frontend
ipcMain.handle('start-pipeline', async (_event, args) => {
    try {
        console.log('received args:', args);
        return new Promise((resolve) => {
            runPipeline({ ...args, callback: resolve });
        });
    }
    catch (error) {
        console.error('Error in start-pipeline:', error);
        return { error: 'Internal Server Error' };
    }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
