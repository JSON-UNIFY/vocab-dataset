import { dirname, resolve } from 'node:path';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'url';
import { readFileSync } from 'node:fs';
import {
  addSchema,
  addMediaTypePlugin,
  validate as jsonschemaValidate
} from '@hyperjump/json-schema/draft-2020-12';
import { defineVocabulary } from '@hyperjump/json-schema/experimental';

// Register vocabulary
const ROOT = dirname(fileURLToPath(import.meta.url));
defineVocabulary('https://json-unify.github.io/vocab-dataset/v1', {});
addSchema(JSON.parse(readFileSync(resolve(ROOT, 'metaschemas', 'v1.json'), 'utf8')));

// Global options
addMediaTypePlugin('application/json', {
  parse: async (response) => [JSON.parse(await response.text()), undefined],
  matcher: (path) => path.endsWith('.json')
});

const randomBytesAsync = promisify(randomBytes);
async function getRandomString() {
  // Small enough to fit most of our constraints
  const result = await randomBytesAsync(6);
  return result.toString('hex');
}

export async function validate (dataset) {
  const identifier = dataset.$id || `https://json-unify.github.io/vocab-dataset/${await getRandomString()}`;
  return jsonschemaValidate('https://json-unify.github.io/vocab-dataset/v1.json', dataset);
}
