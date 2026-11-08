const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pdfApp', {
  saveFromClipboard: () => ipcRenderer.invoke('pdf:saveFromClipboard'),
  listPdfs: () => ipcRenderer.invoke('pdf:list'),
  startDrag: (filePath) => ipcRenderer.send('pdf:startDrag', filePath),
  openFolder: (filePath) => ipcRenderer.invoke('pdf:openFolder', filePath),
});
