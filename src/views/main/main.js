const { ipcRenderer, remote } = require('electron')
const { Menu, MenuItem } = remote
const menu = new Menu()
menu.append(new MenuItem({ label: 'MenuItem1', click () { console.log('item 1 clicked') } }))
menu.append(new MenuItem({ type: 'separator' }))
menu.append(new MenuItem({ label: 'MenuItem2', type: 'checkbox', checked: true }))

const toastr = require('toastr')
toastr.options = {
  debug: false,
  positionClass: 'toast-top-full-width',
  onclick: null,
  fadeIn: 300,
  fadeOut: 1000,
  timeOut: 5000,
  extendedTimeOut: 1000
}

const View = {
  VALUES: {},
  cut: function (value, id) {
    if (value && value.length > 5000) {
      document.getElementById(id + '-more').className = 'floating'
      return value.substr(0, 5000) + '...'
    } else {
      document.getElementById(id + '-more').className = 'floating hidden'
      return value
    }
  },
  show: function (value) {
    const setHeaders = (id, item) => {
      const headers = document.getElementById(id + '-headers')
      headers.innerHTML = ''
      Object.keys(item.headers).forEach(key => {
        headers.innerHTML += `<div class="header-detail"><span class="header-row1">${key}</span><span class="header-row2">${item.headers[key]}</span></div>`
      })
    }
    View.VALUES.selected = value
    const item = View.VALUES[value]
    document.getElementById('request-body').innerText = View.cut(item.request.body, 'request')
    document.getElementById('response-body').innerText = View.cut(item.response.body, 'response')
    document.getElementById('info').innerText = `${item.info.method} http://${item.info.host}${item.info.path} HTTP/${item.info.httpVersion}`
    setHeaders('response', item.response)
    setHeaders('request', item.request)
  },
  getClass: function (status) {
    if (+status < 300) {
      return 'st200'
    }
    if (+status < 400) {
      return 'st300'
    }
    if (+status < 500) {
      return 'st400'
    }
    return 'st500'
  },
  setPanel: function (panelId) {
    const setClass = (id, panelId) => {
      document.getElementById(id + '-headers-label').className = 'header'
      document.getElementById(id + '-body-label').className = 'header'
      document.getElementById(id + '-body').className = 'code hidden'
      document.getElementById(id + '-headers').className = 'headers-container hidden'
      document.getElementById(panelId + '-label').className = 'header selected'
      if (panelId.includes('body')) {
        document.getElementById(id + '-body').className = 'code'
      }
      if (panelId.includes('headers')) {
        document.getElementById(id + '-headers').className = 'headers-container'
      }
    }
    if (panelId.includes('request')) {
      setClass('request', panelId)
    }
    if (panelId.includes('response')) {
      setClass('response', panelId)
    }
  },
  addListeners: () => {
    document.getElementById('optOptions').addEventListener('click', () => {
      ipcRenderer.send('options')
    })
    document.getElementById('optReset').addEventListener('click', () => {
      ipcRenderer.send('reset')
      View.VALUES = {}
      document.getElementById('container').innerHTML = ''
      document.getElementById('info').innerHTML = ''
      document.getElementById('request-body').innerHTML = ''
      document.getElementById('response-body').innerHTML = ''
      document.getElementById('request-headers').innerHTML = ''
      document.getElementById('response-headers').innerHTML = ''
    })
    document.getElementById('request-headers-label').addEventListener('click', () => {
      View.setPanel('request-headers')
    })
    document.getElementById('request-body-label').addEventListener('click', () => {
      View.setPanel('request-body')
    })
    document.getElementById('response-headers-label').addEventListener('click', () => {
      View.setPanel('response-headers')
    })
    document.getElementById('response-body-label').addEventListener('click', () => {
      View.setPanel('response-body')
    })
    document.getElementById('request-more').addEventListener('click', () => {
      document.getElementById('request-more').className = 'floating hidden'
      document.getElementById('request-body').innerText = View.VALUES[View.VALUES.selected].request.body
    })
    document.getElementById('response-more').addEventListener('click', () => {
      document.getElementById('response-more').className = 'floating hidden'
      document.getElementById('response-body').innerText = View.VALUES[View.VALUES.selected].response.body
    })
    $('#listener').change((e) => {
      ipcRenderer.send('listen', e.target.checked)
    })
  }
}

ipcRenderer.on('info', function (event, data) {
  View.VALUES[data.info.id] = data
  document.getElementById('container').innerHTML += `
    <div id="${data.info.id}" class="row">
        <span id="${data.info.id}" class="col1">${data.info.id}</span>
        <span id="${data.info.id}" class="col2"><span class="${View.getClass(data.info.status)}">${data.info.status}</span></span>
        <span id="${data.info.id}" class="col3">${data.info.method}</span>
        <span id="${data.info.id}" class="col4">${data.info.host}</span>
        <span id="${data.info.id}" class="col5">${data.info.request ? 'req' : data.info.response ? 'res' : ''}</span>
        <span id="${data.info.id}" class="col6">${data.info.path}</span>
    </div>`

  document.querySelectorAll('.row').forEach(row => {
    row.addEventListener('click', function (event) {
      document.querySelectorAll('.row').forEach(row => { row.className = 'row' })
      document.querySelector("div.container div[id='" + event.target.id + "']").className = 'row selected'
      View.show(event.target.id)
    })
    row.addEventListener('contextmenu', function (event) {
      event.preventDefault()
      menu.popup({ window: remote.getCurrentWindow() })
    })
  })
})

ipcRenderer.on('load', function (event, data) {
  View.addListeners()
  const sltRule = document.getElementById('ruleSelector')
  sltRule.innerHTML = '<option value="">No rule</option>'
  sltRule.addEventListener('change', (event) => {
    if (event.target.value !== '') {
      toastr.info('set rule to: <strong>' + View.rules[event.target.value].name + '</strong>', 'set rule')
    } else {
      toastr.info('disabling previous rules, no rules defined', 'disable rule')
    }
    View.ruleId = event.target.value
    ipcRenderer.send('rule', View.rules[View.ruleId])
  })
  View.rules = data.rules
  for (var i = 0; i < data.rules.length; i++) {
    sltRule.innerHTML += '<option value="' + i + '">' + data.rules[i].name + '</option>'
  }
  if (!data.init.listen) {
    $('#listener').bootstrapToggle('off')
  }
})
ipcRenderer.send('load')
