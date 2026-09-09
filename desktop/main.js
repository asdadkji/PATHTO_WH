const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');
const os = require('os');

const logFile = path.join(os.tmpdir(), 'kidstaskreward-main.log');
function log(msg) {
  try { fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`); } catch (_) {}
}

app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu-sandbox');

const isDev = !app.isPackaged;
const serverDir = isDev
  ? path.join(__dirname, '..', 'build', 'server')
  : path.join(process.resourcesPath, 'server');
const webRoot = isDev
  ? path.join(__dirname, '..', 'build', 'web')
  : path.join(process.resourcesPath, 'web');

log(`Starting. serverDir=${serverDir} webRoot=${webRoot}`);

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
  log('Creating window...');
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'KidsTaskReward',
    autoHideMenuBar: true,
    webPreferences: { nodeIntegration: false, contextIsolation: true },
  });

  const target = 'http://127.0.0.1:3000';
  try {
    await waitForServer(`${target}/api/health`);
    log('Server ready');
  } catch {
    log('Server did not start in time');
  }
  win.loadURL(target);
  log('Window loaded');
}

log('Registering ready handler...');

app.on('ready', async () => {
  log('app.on(ready) fired!');
  process.env.NODE_ENV = 'production';
  process.env.STATIC_DIR = webRoot;
  process.env.PORT = '3000';

  try {
    process.chdir(serverDir);
    require(path.join(serverDir, 'node_modules', 'tsconfig-paths', 'register'));
    require(path.join(serverDir, 'server.js'));
    log('Server module loaded');
  } catch (err) {
    log(`Server load failed: ${err.message}\n${err.stack}`);
  }

  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log('window-all-closed');
  if (process.platform !== 'darwin') app.quit();
});

process.on('uncaughtException', (err) => {
  log(`uncaughtException: ${err.message}\n${err.stack}`);
});

log('Init complete, waiting for ready event...');
