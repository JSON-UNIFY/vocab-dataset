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
      dataset: [ 'GET', 'POST', 'PUT', 'DELETE', 'PATCH' ]
    }
  }
]

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await validate(testCase.dataset);
    assert.equal(result.valid, testCase.valid);
  });
}
