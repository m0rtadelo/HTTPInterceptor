var ipcRenderer = require('electron').ipcRenderer
function getOptions () {
  return {
    port: document.getElementById('port').value,
    listen: document.getElementById('listen').checked,
    disableCache: document.getElementById('disableCache').checked,
    forceIdentity: document.getElementById('forceIdentity').checked
  }
}
ipcRenderer.on('settings', function (event, options) {
  setTimeout(() => {
    document.getElementById('port').value = options.port
    document.getElementById('listen').checked = options.listen
    document.getElementById('disableCache').checked = options.disableCache
    document.getElementById('forceIdentity').checked = options.forceIdentity
  }, 1)
})
window.addEventListener('unload', () => {
  ipcRenderer.send('options-set', getOptions())
})
document.getElementById('save').addEventListener('click', () => {
  ipcRenderer.send('options-save', getOptions())
  window.close()
})
