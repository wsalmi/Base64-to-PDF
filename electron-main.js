const path = require('path');
const { app, BrowserWindow, ipcMain, nativeImage, shell } = require('electron');
const {
  savePdfFromClipboard,
  listPdfFilesInDownloads,
} = require('./lib/pdf-service');

let mainWindow;

const dragIcon = nativeImage.createFromDataURL(
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAPoAAAD6AG1e1JrAAAA7UlEQVRYhe2WTQ7CIBCFv0vP4J3cS+9gT95I1+Ac3MEd3MnN6LJmYhRBo2A8fP6rM5TQqv2fBkxkNRr9k0Q0hIhI5f+YwWkA3gA3wJ9i2W8DwDGwQm4wHn2x6QmW3N+JxA0q2QG8s8hJ9mG3a0zQ4C1Yx9mX4gV7H5eYlP9hB4g9VJxvVY7A+e4jX9c2xQK3bVQ2r9Qy9Qv7m2Ww0J7i0E3m6u6WQkR8gV1xwQWwF6q1S2f4dYq0k2Q9W6p3hR8M4w1h9ZJwQv8+0nQ2m1YyF7N4M2n8x7J6j7J8Qv8m8Vq7v1WwWgJYd1a3a9k8u6f3xvGxk3gN8A1s8H2D+fT2kJ2cYd2m0G1gAAAABJRU5ErkJggg=='
);

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 640,
    title: 'Base64 PDF Converter',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

ipcMain.handle('pdf:saveFromClipboard', async () => {
  return savePdfFromClipboard();
});

ipcMain.handle('pdf:list', async () => {
  return listPdfFilesInDownloads();
});

ipcMain.on('pdf:startDrag', (event, filePath) => {
  event.sender.startDrag({
    file: filePath,
    icon: dragIcon,
  });
});

ipcMain.handle('pdf:openFolder', async (event, filePath) => {
  if (!filePath) {
    return false;
  }

  return shell.showItemInFolder(filePath);
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
