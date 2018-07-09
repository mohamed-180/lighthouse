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
  Intl.NumberFormat   = IntlPolyfill.NumberFormat;
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

module.exports = {
  UI_STRINGS,
  /**
   * @param {string} filename
   * @param {Record<string, string>} localStrings
   */
  createStringFormatter(filename, localStrings) {
    const mergedStrings = {...UI_STRINGS, ...localStrings};
    /** @param {string} msg @param {*} [values] */
    const format = (msg, values) => {
      const keyname = Object.keys(mergedStrings).find(key => mergedStrings[key] === msg);
      if (!keyname) throw new Error(`Could not locate: ${msg}`);

      const parsed = MessageParser.parse(msg);
      parsed.elements
        .filter(el => el.format && el.format.style === 'bytes')
        .forEach(el => (values[el.id] = values[el.id] / 1024));

      const filenameToLookup = keyname in UI_STRINGS ? __filename : filename;
      const lookupKey = path.relative(LH_ROOT, filenameToLookup) + '!#' + keyname;
      const localeStrings = LOCALES[locale] || {};
      const localeForMessageFormat = locale === 'gibberish' ? 'de-DE' : locale;
      const formatter = new MessageFormat(localeStrings[lookupKey] || msg, localeForMessageFormat, formats);
      return formatter.format(values);
    };

    return format;
  },
  /** @param {string} newLocale */
  setLocale(newLocale) {
    locale = newLocale;
  },
};
