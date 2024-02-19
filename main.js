const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const adb = require('adbkit');
const { createServer } = require('net');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

let windows = [];
const client = adb.createClient({ host: '127.0.0.1' });

// Function to check if the ADB server is running
const isADBServerRunning = async () => {
    return new Promise((resolve) => {
        const serverCheck = createServer({}).listen(5037);
        serverCheck.on('error', () => {
            // If an error occurs, it means the server is already running
            resolve(true);
        });
        serverCheck.on('listening', () => {
            // If listening successfully, close the server and resolve false
            serverCheck.close();
            resolve(false);
        });
    });
};

// Function to start the ADB server
const startADBServer = async () => {
    const isRunning = await isADBServerRunning();
    
    if (!isRunning) {
        try {
            await exec('adb start-server');
            console.log('ADB server started successfully');
        } catch (error) {
            console.error('Error starting ADB server:', error);
        }
    } else {
        console.log('ADB server is already running.');
    }
};

const showDevices = async () => {
    try {
        const devices = await client.listDevices();
        
        if (devices.length > 0) {
            console.log('Connected devices:');
            devices.forEach(device => {
                console.log(`  - ${device.id}`);
            });
        } else {
            console.log('No devices connected.');
        }
    } catch (err) {
        console.error('Error:', err);
    }
};

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        title: 'HTML Repo To Mobile Browser',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('index.html');

    startADBServer();
    showDevices();

    windows.push(mainWindow);
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('requestADBDevices', async () => {
    try {
        const devices = await client.listDevices();
        return devices;
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
});
