const packager = require('electron-packager')
const { rebuild } = require('electron-rebuild')
const { zip } = require('zip-a-folder')
const { version } = require('./package.json')
const fs = require('fs-extra')

const doRebuild = false
const doZip = true

var options = {
  asar: true,
  all: false,
  platform: process.platform,
  arch: 'all',
  dir: './',
  'app-copyright': 'Ricard Fíguls',
  'app-version': version,
  icon: './assets/icon.png',
  name: 'HTTPInterceptor',
  ignore: ['.build/', './.git', '/.nyc_output', '/coverage', '.auth.json', '.build.js', '/tests', '.myteam', '.pdf', '.docx', '.github', 'rules'],
  out: './build',
  overwrite: true,
  prune: true,
  version: version,
  'version-string': {
    CompanyName: 'RFM Software',
    FileDescription: 'HTTPInterceptor',
    OriginalFilename: 'HTTPInterceptor',
    ProductName: 'HTTPInterceptor',
    InternalName: 'HTTPInterceptor'
  },
  afterCopy: [(buildPath, electronVersion, platform, arch, cb) => {
    if (platform === process.platform && doRebuild) {
      console.log('rebuild ' + buildPath + ' (' + arch + ')')
      rebuild({ path: buildPath, buildPath, electronVersion, arch })
        .then(() => cb())
        .catch(err => { console.error(`Oooops ${platform}.${arch} rebuild ERROR!`); cb() })
    } else {
      cb()
    }
  }]
}

async function build () {
  console.log('Removing build folder...')
  fs.removeSync('./build', { recursive: true })
  console.log('Building version ' + version + ' for ' + process.platform + '...')
  const paths = await packager(options)
  if (doZip) {
    console.log('zipping files...')
    paths.forEach(async p => {
      const name = p.split(' /').pop()
      await zip('./' + p, './' + name + '.zip')
      console.log(p + '.zip file created!')
    })
  }
}

build()
