import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';
import fetch from 'node-fetch';
import * as jsonpatch from 'fast-json-patch/index.mjs';
import {
  addSchema,
  addMediaTypePlugin,
  validate as jsonschemaValidate
} from '@hyperjump/json-schema/draft-2020-12';
import { defineVocabulary, BASIC } from '@hyperjump/json-schema/experimental';

// Register vocabulary
const ROOT = dirname(fileURLToPath(import.meta.url));
defineVocabulary('https://json-unify.github.io/vocab-dataset/v1', {});
addSchema(JSON.parse(readFileSync(resolve(ROOT, 'metaschemas', 'v1.json'), 'utf8')));

// Global options
addMediaTypePlugin('application/json', {
  parse: async (response) => [JSON.parse(await response.text()), undefined],
  matcher: (path) => path.endsWith('.json')
});

const randomBytesAsync = promisify(randomBytes);
async function getRandomString() {
  // Small enough to fit most of our constraints
  const result = await randomBytesAsync(6);
  return result.toString('hex');
}

export async function validate (dataset) {
  const identifier = dataset.$id ||
    `https://json-unify.github.io/vocab-dataset/${await getRandomString()}`;
  const metaschemaResult = await jsonschemaValidate('https://json-unify.github.io/vocab-dataset/v1.json',
    dataset, BASIC);
  if (!metaschemaResult.valid) {
    return metaschemaResult;
  }

  addSchema(dataset, identifier);

  const data = Array.isArray(dataset.dataset)
    ? dataset.dataset
    : await (await fetch(dataset.dataset.$ref)).json();

  for (const row of data) {
    const rowResult = await jsonschemaValidate(identifier, row, BASIC);
    if (!rowResult.valid) {
      console.log(row);
      return rowResult;
    }
  }

  return metaschemaResult;
}

export async function read (dataset) {
  const result = [];

  const data = Array.isArray(dataset.dataset)
    ? dataset.dataset
    : await (await fetch(dataset.dataset.$ref)).json();

  for (const row of data) {
    result.push(row);
  }

  if (dataset.datasetPatch) {
    return jsonpatch.applyPatch(data, dataset.datasetPatch).newDocument;
  }

  return result;
}
