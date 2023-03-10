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
  },
  {
    name: 'external scalar dataset',
    data: [ 0, 1, 1, 2, 3, 5, 8, 13, 21, 34 ],
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'Fibonacci example',
      type: 'integer',
      dataset: 'https://json-unify.github.io/vocab-dataset/examples/fibonacci-10.json'
    }
  },
  {
    name: 'remote scalar dataset with patch',
    data: [ 0, 2, 2, 4, 6, 10, 16, 26, 42, 68 ],
    dataset: {
      $schema: 'https://json-unify.github.io/vocab-dataset/v1.json',
      title: 'List of integers',
      type: 'integer',
      dataset: 'https://json-unify.github.io/vocab-dataset/examples/fibonacci-10.json',
      datasetTransform: {
        $map: { $eval: 'dataset' },
        'each(x)': { $eval: 'x * 2' }
      }
    }
  },
]

for (const testCase of testCases) {
  test(testCase.name, async () => {
    const result = await validate(testCase.dataset);
    assert.ok(result.valid);
    const data = await read(testCase.dataset);
    assert.deepEqual(data, testCase.data);
  });
}
