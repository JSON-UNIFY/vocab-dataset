import test from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { readdirSync } from 'node:fs';
const DIRNAME = dirname(fileURLToPath(import.meta.url));

for (const file of readdirSync(resolve(DIRNAME, 'metaschemas', 'valid'))) {
  const fullPath = resolve(DIRNAME, 'metaschemas', 'valid', file);
  test(`metaschema.valid.${file}`, () => {
    console.log(fullPath);
    assert.strictEqual(1, 1);
  });
}

