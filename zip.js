const { zip } = require("zip-a-folder")

async function zipped() {
var options = {
    all: false,
    dir: './',
    'app-copyright': 'Ricard Fíguls',
    'app-version': version,
    icon: './assets/icon.png',
    name: 'HTTPInterceptor',
    ignore: ['.build/', './.git', '/.nyc_output', '/coverage', '.auth.json', '.build.js', '/tests', '.myteam', '.pdf', '.docx'],
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
    }
  }
const paths = await packager(options)
paths.forEach(async p => {
    const name = p.split(' /').pop()
    await zip('./' + p, './' + name + '.zip')
    console.log(p + '.zip file created!')
  })
}

await zipped()