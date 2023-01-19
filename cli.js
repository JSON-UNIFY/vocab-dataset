import { validate, read } from './sdk.js';

function onError(message) {
  console.error(message);
  process.exit(1);
}

const COMMAND = process.argv[2];
if (!COMMAND) {
  onError(`${process.argv[0]} ${process.argv[1]} <validate|read>`);
}

const input = []
process.stdin.on('data', (data) => input.push(data.toString()));
process.stdin.on('end', () => {
  const dataset = JSON.parse(input.join());

  if (COMMAND === 'validate') {
    validate(dataset).then((result) => {
      if (result.valid) {
        console.error('Valid');
      } else {
        onError(JSON.stringify(result, null, 2));
      }
    }).catch(onError);
  } else if (COMMAND === 'read') {
    read(dataset).then((result) => {
      console.log(JSON.stringify(result, null, 2));
    }).catch(onError);
  } else {
    onError(`Unknown command: ${COMMAND}`);
  }
});

process.stdin.resume();
