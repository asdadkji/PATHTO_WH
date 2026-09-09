const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

const isDev = !app.isPackaged;
const serverDir = isDev
  ? path.join(__dirname, '..', 'build', 'server')
  : path.join(process.resourcesPath, 'server');
const webRoot = isDev
  ? path.join(__dirname, '..', 'build', 'web')
  : path.join(process.resourcesPath, 'web');

function waitForServer(url, retries = 30, interval = 500) {
  return new Promise((resolve, reject) => {
    let tries = 0;
    const check = () => {
      http.get(url, (res) => {
        res.resume();
        resolve();
      }).on('error', () => {
        if (++tries >= retries) return reject(new Error('Server timeout'));
        setTimeout(check, interval);
      });
    };
    check();
  });
}

async function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'KidsTaskReward',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const target = 'http://127.0.0.1:3000';
  try {
    await waitForServer(`${target}/api/health`);
  } catch {
    console.error('Server did not start in time');
  }
  win.loadURL(target);
}

app.whenReady(async () => {
  process.env.NODE_ENV = 'production';
  process.env.STATIC_DIR = webRoot;
  process.env.PORT = '3000';

  try {
    require(path.join(serverDir, 'server.js'));
    console.log('[main] Server module loaded');
  } catch (err) {
    console.error('[main] Failed to load server:', err);
  }

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
