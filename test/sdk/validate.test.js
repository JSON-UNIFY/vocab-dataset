import test from 'node:test';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'url';
import { strict as assert } from 'node:assert';
import { readdirSync, readFileSync } from 'node:fs';
import { validate } from '../../sdk.js';

const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const testCases = [
  {
    name: 'valid dataset with embedded schema',
    valid: true,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: [ 1, 2, 3 ]
    }
  },
  {
    name: 'valid dataset with external schema',
    valid: true,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of basic HTTP methods',
      allOf: [ { $ref: 'https://schemas.sourcemeta.com/http1.1/method/v1.json' } ],
      dataset: [ 'GET', 'POST', 'PUT', 'DELETE' ]
    }
  },
  {
    name: 'valid dataset with external schema and no allOf',
    valid: true,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of basic HTTP methods',
      $ref: 'https://schemas.sourcemeta.com/http1.1/method/v1.json',
      dataset: [ 'GET', 'POST', 'PUT', 'DELETE' ]
    }
  },
  {
    name: 'invalid dataset with embedded schema',
    valid: false,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: [ 1, 2.1, 3 ]
    }
  },
  {
    name: 'invalid dataset with external schema',
    valid: false,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of basic HTTP methods',
      allOf: [ { $ref: 'https://schemas.sourcemeta.com/http1.1/method/v1.json' } ],
      dataset: [ 'GET', 'POST', 'INVALID_METHOD', 'DELETE' ]
    }
  }
]

const EXAMPLES = resolve(ROOT, 'examples');
for (const file of readdirSync(EXAMPLES)) {
  if (extname(file) !== '.json') {
    continue;
  }

  const dataset = JSON.parse(readFileSync(resolve(EXAMPLES, file), 'utf8'));
  if (Array.isArray(dataset)) {
    continue;
  }

  testCases.push({ name: file, valid: true, dataset });
}

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await validate(testCase.dataset);
    assert.equal(result.valid, testCase.valid);
  });
}

