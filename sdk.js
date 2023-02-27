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

// Register dataset vocabulary
const BASE_URL = 'https://json-unify.github.io/vocab-dataset';
const ROOT = dirname(fileURLToPath(import.meta.url));
defineVocabulary(`${BASE_URL}/v1`, {});
addSchema(JSON.parse(readFileSync(resolve(ROOT, 'metaschemas', 'v1.json'), 'utf8')));

// Teach Hyperjump to load remote schemas hosted on GitHub Pages
addMediaTypePlugin('application/json', {
  parse: async (response) => [JSON.parse(await response.text()), undefined],
  matcher: (path) => path.endsWith('.json')
});

// Hyperjump enforces schemas to always have an identifier
const randomBytesAsync = promisify(randomBytes);
async function getRandomDatasetId() {
  // Small enough to fit most of our constraints
  const result = await randomBytesAsync(6);
  return `${BASE_URL}/dataset/${result.toString('hex')}`
}

export async function validate (dataset) {
  const identifier = dataset.$id || await getRandomDatasetId();
  const metaschemaResult = await jsonschemaValidate(
    `${BASE_URL}/v1.json`, dataset, BASIC);
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

  const finalResult = dataset.datasetPatch
    ? jsonpatch.applyPatch(data, dataset.datasetPatch).newDocument
    : result;

  const identifier = dataset.$id || await getRandomDatasetId();
  addSchema(dataset, identifier);
  for (const row of finalResult) {
    const rowResult = await jsonschemaValidate(identifier, row, BASIC);
    if (!rowResult.valid) {
      throw new Error(`Invalid row: ${row}`)
    }
  }

  return finalResult;
}
