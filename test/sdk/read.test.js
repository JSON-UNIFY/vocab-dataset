import test from 'node:test';
import { strict as assert } from 'node:assert';
import { validate, read } from '../../sdk.js';

const testCases = [
  {
    name: 'local empty dataset',
    data: [],
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Empty dataset',
      type: 'integer',
      dataset: []
    }
  },
  {
    name: 'local scalar dataset',
    data: [ 1, 2, 3 ],
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: [ 1, 2, 3 ]
    }
  }
]

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await validate(testCase.dataset);
    assert.ok(result.valid);
    const data = await read(testCase.dataset);
    assert.deepEqual(data, testCase.data);
  });
}
