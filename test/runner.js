import test from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { readdirSync, readFileSync } from 'node:fs';
import jsonschema from '@hyperjump/json-schema';
const DIRNAME = dirname(fileURLToPath(import.meta.url));

jsonschema.setShouldMetaValidate(true);

for (const version of [ 'v1' ]) {
  jsonschema.add(JSON.parse(readFileSync(resolve(DIRNAME, '..', 'metaschemas', `${version}.json`), 'utf8')));
  for (const mode of [ 'valid', 'invalid' ]) {
    for (const file of readdirSync(resolve(DIRNAME, 'metaschemas', version, mode))) {
      test(`metaschema.${version}.${mode}.${file}`, async () => {
        const metaschemaId = `https://json-unify.github.io/vocab-dataset/${version}.json`;
        const metaschema = await jsonschema.get(metaschemaId);
        assert.ok(metaschema);
        const schema = JSON.parse(readFileSync(resolve(DIRNAME, 'metaschemas', version, mode, file), 'utf8'));
        if (schema.$schema) {
          assert.equal(schema.$schema, metaschemaId);
        }

        const output = await jsonschema.validate(metaschema, schema, jsonschema.BASIC);
        const expected = mode === 'valid' ? true : false;
        if (output.valid !== expected) {
          console.error(JSON.stringify(output, null, 2));
        }

        assert.equal(output.valid, expected);
      });
    }
  }
}
