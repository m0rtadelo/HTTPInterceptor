const { app, BrowserWindow } = require('electron')
const { ipcMain } = require('electron')

const rules = require('./src/models/rules')

const DEV = false

const Proxy = require('./src/proxy.js').Proxy
let _Server
function createWindow () {
  const win = new BrowserWindow({
    width: 1300,
    height: 700,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.menuBarVisible = false
  win.loadFile('src/views/main/main.html')
  if (DEV) {
    win.webContents.openDevTools()
  }
  Proxy.win = win
  try {
    if (Proxy.options.getListen()) {
      _Server = Proxy.http().listen(Proxy.options.getPort())
    }
  } catch (error) {
    console.error(error, 'Error listening')
  }
  ipcMain.on('options', (event, arg) => {
    const options = new BrowserWindow({
      modal: true,
      parent: win,
      width: 330,
      height: 360,
      title: 'Options',
      webPreferences: {
        nodeIntegration: true
      }
    })
    if (DEV) {
      options.webContents.openDevTools()
    }
    options.menuBarVisible = false
    options.loadFile('src/views/settings/settings.html')
    options.webContents.on('did-finish-load', () => {
      options.webContents.send('settings', Proxy.options.getValues())
    })
  })

  ipcMain.on('options-set', (event, args) => {
    Proxy.options.setValues(args)
  })
  ipcMain.on('options-save', (event, args) => {
    Proxy.options.save(args)
  })
  ipcMain.on('reset', (event, arg) => {
    Proxy.reset()
  })

  ipcMain.on('rule', (event, data) => {
    if (!data) {
      Proxy.setRules(data)
    } else {
      rules.getRule(data).then(content => {
        Proxy.setRules(content)
      })
    }
  })
  ipcMain.on('listen', (event, data) => {
    if (data) {
      if (_Server) {
        _Server.listen(Proxy.options.getPort())
      } else {
        _Server = Proxy.http().listen(Proxy.options.getPort())
      }
    } else {
      if (_Server) {
        _Server.close()
      }
    }
  })
}

ipcMain.on('load', (event, arg) => {
  rules.getRules().then(files => {
    event.reply('load',
      {
        init: { listen: Proxy.options.getListen() },
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
