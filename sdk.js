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
  const result = Object.assign({}, dataset);
  if (typeof result.dataset === 'string') {
    const data = await fetch(result.dataset);
    const contentType = data.headers.get('content-type');
    if (contentType.startsWith('application/json')) {
      result.dataset = await data.json();
    } else if (contentType.startsWith('text/csv')) {
      const content = await data.text();
      result.dataset = content.split('\n').filter((line) => {
        return line.trim().length > 0;
      }).map((line) => {
        return line.trim().split(';').map((word) => {
          return word.trim().slice(1, word.length - 1);
        });
      });

      console.log(result.dataset);
    } else {
      throw new Error(`Unknown content type: ${contentType}`);
    }
  }

  return result;
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
          dataset: { items: { $ref: identifier } }
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
  const result = await validate(newDataset);
  if (!result.valid) {
    throw new Error('Invalid dataset');
  }

  return newDataset.dataset;
}
