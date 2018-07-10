/**
 * @license Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

const path = require('path');
const MessageFormat = require('intl-messageformat').default;
const MessageParser = require('intl-messageformat-parser');
const LOCALES = require('./locales');

let locale = MessageFormat.defaultLocale;

const LH_ROOT = path.join(__dirname, '../../');

try {
  // Node usually doesn't come with the locales we want built-in so we'll use the polyfill anyway

  // @ts-ignore
  require('intl');
  // @ts-ignore
  Intl.NumberFormat = IntlPolyfill.NumberFormat;
  // @ts-ignore
  Intl.DateTimeFormat = IntlPolyfill.DateTimeFormat;
} catch (_) {}

const UI_STRINGS = {
  ms: '{timeInMs, number, milliseconds} ms',
  columnURL: 'URL',
  columnSize: 'Size (KB)',
  columnWastedTime: 'Potential Savings (ms)',
};

const formats = {
  number: {
    milliseconds: {
      maximumFractionDigits: 0,
      maximumSignificantDigits: 2,
    },
    seconds: {},
    bytes: {},
  },
};

function preprocessMessageValues(msg, values) {
  const parsed = MessageParser.parse(msg);
  // Replace all the bytes with KB
  parsed.elements
    .filter(el => el.format && el.format.style === 'bytes')
    .forEach(el => (values[el.id] = values[el.id] / 1024));
}

module.exports = {
  UI_STRINGS,
  /**
   * @param {string} filename
   * @param {Record<string, string>} fileStrings
   */
  createStringFormatter(filename, fileStrings) {
    const mergedStrings = {...UI_STRINGS, ...fileStrings};
    /** @param {string} msg @param {*} [values] */
    const formatFn = (msg, values) => {
      const keyname = Object.keys(mergedStrings).find(key => mergedStrings[key] === msg);
      if (!keyname) throw new Error(`Could not locate: ${msg}`);
      preprocessMessageValues(msg, values);

      const filenameToLookup = keyname in UI_STRINGS ? __filename : filename;
      const lookupKey = path.relative(LH_ROOT, filenameToLookup) + '!#' + keyname;
      const localeStrings = LOCALES[locale] || {};
      // fallback to the original english message if we couldn't find a message in the specified locale
      // better to have an english message than no message at all, in some number cases it won't even matter
      const messageForMessageFormat = localeStrings[lookupKey] || msg
      // when using accented english, force the use of a different locale for numbers
      const localeForMessageFormat = locale === 'en-XA' ? 'de-DE' : locale;

      const formatter = new MessageFormat(
        messageForMessageFormat,
        localeForMessageFormat,
        formats
      );
      return formatter.format(values);
    };

    return formatFn;
  },
  /** @param {string} newLocale */
  setLocale(newLocale) {
    locale = newLocale;
  },
};
