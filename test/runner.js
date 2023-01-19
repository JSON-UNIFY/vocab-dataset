import test from 'node:test';
import { strict as assert } from 'node:assert';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'url';
import { readdirSync, readFileSync } from 'node:fs';
import { addMediaTypePlugin, addSchema, validate } from '@hyperjump/json-schema/draft-2020-12';
import { defineVocabulary, BASIC } from '@hyperjump/json-schema/experimental';
const DIRNAME = dirname(fileURLToPath(import.meta.url));

addMediaTypePlugin('application/json', {
  parse: async (response) => [JSON.parse(await response.text()), undefined],
  matcher: (path) => path.endsWith('.json')
});

for (const version of [ 'v1' ]) {
  defineVocabulary(`https://json-unify.github.io/vocab-dataset/${version}`, {});
  const metaschema = JSON.parse(readFileSync(resolve(DIRNAME, '..', 'metaschemas', `${version}.json`), 'utf8'));
  addSchema(metaschema);
  for (const mode of [ 'valid', 'invalid' ]) {
    for (const file of readdirSync(resolve(DIRNAME, 'metaschemas', version, mode))) {
      test(`metaschema.${version}.${mode}.${file}`, async () => {
        const metaschemaId = `https://json-unify.github.io/vocab-dataset/${version}.json`;
        const schema = JSON.parse(readFileSync(resolve(DIRNAME, 'metaschemas', version, mode, file), 'utf8'));
        if (schema.$schema) {
          assert.equal(schema.$schema, metaschemaId);
        }

        const output = await validate(metaschemaId, schema, BASIC);
        const expected = mode === 'valid' ? true : false;
        if (output.valid !== expected) {
          console.error(JSON.stringify(output, null, 2));
        }

        assert.equal(output.valid, expected);
      });
    }
  }
}
