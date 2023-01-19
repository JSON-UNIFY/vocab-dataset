import test from 'node:test';
import { strict as assert } from 'node:assert';
import { validate } from '../../sdk.js';

const testCases = [
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
    name: 'no dataset keyword',
    valid: false,
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of basic HTTP methods'
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

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await validate(testCase.dataset);
    assert.equal(result.valid, testCase.valid);
  });
}
