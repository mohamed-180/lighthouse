const fs = require('fs');
const path = require('path');

const LH_ROOT = path.join(__dirname, '../../../');

const ignoredPathComponents = [
  '/.git',
  '/scripts',
  '/node_modules',
  '/renderer',
  '/test/',
  '-test.js',
];

function collectAllStringsInDir(dir, strings = {}) {
  for (const name of fs.readdirSync(dir)) {
    const fullPath = path.join(dir, name);
    const relativePath = path.relative(LH_ROOT, fullPath);
    if (ignoredPathComponents.some(p => fullPath.includes(p))) continue;

    if (fs.statSync(fullPath).isDirectory()) {
      collectAllStringsInDir(fullPath, strings);
    } else {
      if (name.endsWith('.js')) {
        console.log('Collecting from', relativePath);
        const mod = require(fullPath);
        if (!mod.UI_STRINGS) continue;
        for (const [key, value] of Object.entries(mod.UI_STRINGS)) {
          strings[`${relativePath}!#${key}`] = value;
        }
      }
    }
  }

  return strings;
}

function createPsuedoLocaleStrings(strings) {
  const psuedoLocalizedStrings = {};
  for (const [key, string] of Object.entries(strings)) {
    const psuedoLocalizedString = [];
    let braceCount = 0;
    for (let i = 0; i < string.length; i++) {
      const char = string.substr(i, 1);
      psuedoLocalizedString.push(char);
      // Don't touch the characters inside braces
      if (char === '{') braceCount++;
      else if (char === '}') braceCount--;
      else if (braceCount === 0) {
        if (/[a-z]/i.test(char)) {
          psuedoLocalizedString.push(Math.random() > 0.5 ? `\u0301` : `\u0302`);
        }
      }
    }

    psuedoLocalizedStrings[key] = psuedoLocalizedString.join('');
  }

  return psuedoLocalizedStrings;
}

function writeStringsToLocaleFormat(locale, strings) {
  const fullPath = path.join(LH_ROOT, 'lighthouse-core/lib/locales/', `${locale}.js`);
  const outputObject = {};
  for (const [key, message] of Object.entries(strings)) {
    outputObject[key] = {message};
  }

  const outputString = `
    module.exports = ${JSON.stringify(outputObject, null, 2)};
  `.trim();

  fs.writeFileSync(fullPath, outputString);
}

const strings = collectAllStringsInDir(path.join(LH_ROOT, 'lighthouse-core'));
const psuedoLocalizedStrings = createPsuedoLocaleStrings(strings);
console.log('Collected!');

writeStringsToLocaleFormat('en-US', strings);
writeStringsToLocaleFormat('en-XA', psuedoLocalizedStrings);
console.log('Written to disk!');
