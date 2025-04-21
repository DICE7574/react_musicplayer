const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadURL('http://localhost:5173'); // Vite 개발 서버
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});