// i18n parity check — Task M-04.
// Usage: npm run i18n:check
// Fails (exit 1) if the French dictionary is missing any English key
// or contains a key English does not have, so en/fr can never drift
// apart silently. Run it before shipping any new UI string.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function load(locale) {
  return JSON.parse(
    readFileSync(path.join(root, 'src/lib/i18n/locales', `${locale}.json`), 'utf8')
  );
}

function leafKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...leafKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

const enKeys = leafKeys(load('en'));
const frKeys = leafKeys(load('fr'));
const enSet = new Set(enKeys);
const frSet = new Set(frKeys);
const missingInFr = enKeys.filter((k) => !frSet.has(k));
const extraInFr = frKeys.filter((k) => !enSet.has(k));

console.log(`en: ${enKeys.length} keys, fr: ${frKeys.length} keys`);
if (missingInFr.length) {
  console.log('\nMissing in fr.json:');
  for (const k of missingInFr) console.log(`  - ${k}`);
}
if (extraInFr.length) {
  console.log('\nExtra in fr.json (no English counterpart):');
  for (const k of extraInFr) console.log(`  - ${k}`);
}
if (missingInFr.length || extraInFr.length) {
  console.log('\ni18n parity check FAILED.');
  process.exit(1);
}
console.log('i18n parity check passed: en and fr keys match.');
