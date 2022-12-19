import test from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { readdirSync, readFileSync } from 'node:fs';
import jsonschema from '@hyperjump/json-schema';
const DIRNAME = dirname(fileURLToPath(import.meta.url));

for (const version of [ 'v1' ]) {
  jsonschema.add(JSON.parse(readFileSync(resolve(DIRNAME, '..', 'metaschemas', `${version}.json`), 'utf8')));
  for (const mode of [ 'valid' ]) {
    for (const file of readdirSync(resolve(DIRNAME, 'metaschemas', version, mode))) {
      test(`metaschema.${version}.${mode}.${file}`, async () => {
        const metaschemaId = `https://json-unify.github.io/vocab-dataset/${version}.json`;
        const metaschema = await jsonschema.get(metaschemaId);
        assert.ok(metaschema);
        const schema = JSON.parse(readFileSync(resolve(DIRNAME, 'metaschemas', version, mode, file), 'utf8'));
        assert.equal(schema.$schema, metaschemaId);
        const output = await jsonschema.validate(metaschema, 'foo', jsonschema.FLAG);
        if (!output.valid) {
          console.error(JSON.stringify(output.errors, null, 2));
        }
        assert.ok(output.valid);
      });
    }
  }
}
