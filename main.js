const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')
const rra = require('recursive-readdir-async')
const lj = require('load-json-file')

const Proxy = require('./proxy.js').Proxy
let _Server
function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.menuBarVisible = false
  win.loadFile('index.html')
  // win.webContents.openDevTools()
  Proxy.win = win
  try {
    if(Proxy.options.listen){
      _Server = Proxy.http().listen(Proxy.options.port);
    }
  } catch (error) {
    Proxy.showError(error, 'Error listening')
  }
  ipcMain.on('options', (event, arg) => {
    const options = new BrowserWindow({
      modal: true,
      parent: win,
      width: 800,
      height: 500,
      title: 'Options',
      webPreferences: {
        nodeIntegration: false
      }
    })
    options.menuBarVisible = false
    options.loadFile('./options.html')
  })
  
  ipcMain.on('reset', (event, arg) => {
    Proxy.reset()
  })

  ipcMain.on('rule', (event, data) => {
    if (!data) {
      Proxy.setRules(data)
    } else {
      lj(data.fullname).then(content => {
        Proxy.setRules(content)
      })
    }
  })
  ipcMain.on('listen', (event, data) => {
    if(data) {
      if (_Server) {
        _Server.listen(Proxy.options.port)
      } else {
        _Server = Proxy.http().listen(Proxy.options.port)
      }
    } else {
      if(_Server) {
        _Server.close()
      }
    }
  })
}

ipcMain.on('load', (event, arg) => {
  rra.list('./rules').then(files => {
    event.reply('load', 
      {
        init:{ listen: Proxy.options.listen },
        rules: files && !files.error ? files.filter(item => !item.isDirectory) : []
      }
    )
  })
})
app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
