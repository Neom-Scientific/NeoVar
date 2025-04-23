// preload.js

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startPipeline: (args) => ipcRenderer.invoke('start-pipeline', args),
});

console.log('Preload script loaded and electronAPI exposed');