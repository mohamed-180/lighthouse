const fs = require('fs')
const path = require('path')

const LH_ROOT = path.join(__dirname, '../../')

const strings = {}

const bannedPathComponents = [
  '/.git',
  '/docs',
  '/coverage',
  '/scripts',
  '/node_modules',
  '/lighthouse-cli',
  '/renderer',
  '/test/',
  '-test.js',
  'lighthouse-viewer',
  'lighthouse-extension',
]

function collectAllStringsInDir(dir) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name)
    const relativePath = path.relative(LH_ROOT, fullPath)
    if (bannedPathComponents.some(p => fullPath.includes(p))) continue

    if (fs.statSync(fullPath).isDirectory()) {
      collectAllStringsInDir(fullPath)
    } else {
      if (name.endsWith('.js')) {
        console.log('Collecting from', relativePath)
        const mod = require(fullPath)
        if (!mod.UI_STRINGS) continue
        for (const [key, value] of Object.entries(mod.UI_STRINGS)) {
          strings[`${relativePath}!#${key}`] = value
        }
      }
    }
  }
}

collectAllStringsInDir(path.join(LH_ROOT, 'lighthouse-core'))
console.log('Done!')

fs.writeFileSync(path.join(LH_ROOT, 'lighthouse-core/lib/locales/en-US.js'), 'module.exports = ' + JSON.stringify(strings, null, 2) + ';')

const gibberish = {}
for (const [key, value] of Object.entries(strings)) {
  const gibberishValue = []
  let braceCount = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.substr(i, 1)
    gibberishValue.push(char)
    if (char === '{') braceCount++
    else if (char === '}') braceCount--
    else if (braceCount === 0) {
      if (/[a-z]/i.test(char)) {
        gibberishValue.push(Math.random() > 0.5 ? `\u0301` : `\u0302`)
      }
    }
  }
  gibberish[key] = gibberishValue.join('')
}

fs.writeFileSync(path.join(LH_ROOT, 'lighthouse-core/lib/locales/gibberish.js'), 'module.exports = ' + JSON.stringify(gibberish, null, 2) + ';')
