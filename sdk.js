import assert from 'node:assert/strict';
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
  return `${BASE_URL}/random/${result.toString('hex')}`
}

export async function bundle (dataset) {
  return Object.assign({}, dataset, typeof dataset.dataset === 'string' ? {
    dataset: await (await fetch(dataset.dataset)).json()
  } : {});
}

export async function validate (dataset) {
  const identifier = dataset.$id || await getRandomDatasetId();
  const newDataset = await bundle(dataset);

  const mockMetaschema = {
    $id: await getRandomDatasetId(),
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    allOf: [
      { $ref: `${BASE_URL}/v1.json` },
      {
        properties: {
          dataset: {
            items: { $ref: identifier }
          }
        }
      }
    ]
  };

  addSchema(newDataset, identifier);
  addSchema(mockMetaschema);
  return jsonschemaValidate(mockMetaschema.$id, newDataset, BASIC);
}

export async function read (dataset) {
  const newDataset = await bundle(dataset);
  if (newDataset.datasetPatch) {
    jsonpatch.applyPatch(newDataset.dataset, newDataset.datasetPatch);
  }
  await validate(newDataset);
  return newDataset.dataset;
}
