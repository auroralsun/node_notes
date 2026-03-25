const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const isDev = !app.isPackaged
let mainWindow = null
let nextServer = null

function getNodeBinary() {
  if (isDev) {
    return process.platform === 'win32' ? 'node.exe' : 'node'
  }

  return process.execPath
}

function getAppUrl() {
  return process.env.ELECTRON_START_URL || 'http://127.0.0.1:3000'
}

function getLogFile() {
  return path.join(app.getPath('userData'), 'next-server.log')
}

function appendLog(message) {
  try {
    fs.mkdirSync(path.dirname(getLogFile()), { recursive: true })
    fs.appendFileSync(getLogFile(), `[${new Date().toISOString()}] ${message}\n`)
  } catch {}
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1100,
    minHeight: 760,
    autoHideMenuBar: true,
    title: '知识图谱笔记',
    backgroundColor: '#f8f3ea',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#f8f3ea',
      symbolColor: '#3f3124',
      height: 56
    },
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs')
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.loadURL(getAppUrl())

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function getProductionServerEntrypoint() {
  return path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js')
}

function getProductionWorkingDirectory() {
  return path.join(process.resourcesPath, 'app', '.next', 'standalone')
}

function getProductionDatabaseUrl() {
  return `file:${path.join(process.resourcesPath, 'prisma', 'dev.db').replace(/\\/g, '/')}`
}

function startNextServer() {
  if (isDev) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      HOSTNAME: '127.0.0.1',
      PORT: process.env.PORT || '3000',
      DATABASE_URL: process.env.DATABASE_URL || getProductionDatabaseUrl()
    }

    appendLog(`starting server with entry: ${getProductionServerEntrypoint()}`)
    appendLog(`cwd: ${getProductionWorkingDirectory()}`)
    appendLog(`db: ${env.DATABASE_URL}`)

    nextServer = spawn(getNodeBinary(), [getProductionServerEntrypoint()], {
      cwd: getProductionWorkingDirectory(),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true
    })

    nextServer.stdout.on('data', (chunk) => appendLog(`stdout: ${String(chunk).trim()}`))
    nextServer.stderr.on('data', (chunk) => appendLog(`stderr: ${String(chunk).trim()}`))

    nextServer.once('spawn', () => {
      appendLog('spawned next server')
      setTimeout(resolve, 5000)
    })

    nextServer.once('error', (error) => {
      appendLog(`spawn error: ${error.message}`)
      reject(error)
    })

    nextServer.once('exit', (code, signal) => {
      appendLog(`server exit code=${code} signal=${signal}`)
    })
  })
}

function stopNextServer() {
  if (nextServer) {
    nextServer.kill()
    nextServer = null
  }
}

app.whenReady().then(async () => {
  await startNextServer()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopNextServer()
})
