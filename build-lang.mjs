#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SOURCE = join(ROOT, 'lang.json');
const TARGET = join(ROOT, 'main.user.js');

const INDENT = '    ';
const OPEN = `${INDENT}const LANGS = {`;
const CLOSE = `${INDENT}};`;

function fail(message) {
    console.error(`build-lang: ${message}`);
    process.exit(1);
}

const langs = JSON.parse(readFileSync(SOURCE, 'utf8'));
if (!langs.en) fail('lang.json has no "en" entry; the script falls back to it for unknown locales.');

const expected = Object.keys(langs.en);
for (const [code, table] of Object.entries(langs)) {
    const missing = expected.filter(key => !(key in table));
    const extra = Object.keys(table).filter(key => !expected.includes(key));
    const blank = expected.filter(key => typeof table[key] === 'string' && table[key].trim() === '');
    if (missing.length) fail(`locale "${code}" is missing labels: ${missing.join(', ')}`);
    if (extra.length) fail(`locale "${code}" has labels absent from "en": ${extra.join(', ')}`);
    if (blank.length) fail(`locale "${code}" has empty labels: ${blank.join(', ')}`);
}

const source = readFileSync(TARGET, 'utf8');
const eol = source.includes('\r\n') ? '\r\n' : '\n';
const begin = source.indexOf(OPEN);
if (begin === -1) fail(`could not find "${OPEN.trim()}" in ${TARGET}`);
const closeAt = source.indexOf(eol + CLOSE, begin);
if (closeAt === -1) fail(`could not find the end of the LANGS object in ${TARGET}`);
const end = closeAt + eol.length + CLOSE.length;

const body = JSON.stringify(langs, null, 4)
    .split('\n')
    .map((line, index) => (index === 0 ? line : INDENT + line))
    .join(eol);

const next = source.slice(0, begin) + `${INDENT}const LANGS = ${body};` + source.slice(end);

if (next === source) {
    console.log('build-lang: main.user.js already matches lang.json.');
} else {
    writeFileSync(TARGET, next);
    console.log(`build-lang: wrote ${Object.keys(langs).length} locales into main.user.js.`);
}
