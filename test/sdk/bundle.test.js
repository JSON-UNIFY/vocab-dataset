import test from 'node:test';
import { strict as assert } from 'node:assert';
import { bundle } from '../../sdk.js';

const testCases = [
  {
    name: 'local empty dataset',
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Empty dataset',
      type: 'integer',
      dataset: []
    },
    result: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Empty dataset',
      type: 'integer',
      dataset: []
    }
  },
  {
    name: 'local scalar dataset',
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: [ 1, 2, 3 ]
    },
    result: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: [ 1, 2, 3 ]
    }
  },
  {
    name: 'external scalar dataset',
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Fibonacci example',
      type: 'integer',
      dataset: 'https://json-unify.github.io/vocab-dataset/examples/fibonacci-10.json'
    },
    result: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Fibonacci example',
      type: 'integer',
      dataset: [ 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 ]
    }
  },
]

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await bundle(testCase.dataset);
    assert.deepEqual(result, testCase.result);
  });
}
