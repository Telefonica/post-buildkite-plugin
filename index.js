#!/usr/bin/env node

const yaml = require('js-yaml');

main()
  .then(ret => console.log(JSON.stringify(ret, null, 2)))
  .catch(err => { console.error(err); process.exit(1); })

async function main() {
  const input = await getStdin();
  console.log(JSON.stringify(input, null,2))
  const map = await buildMap(input);
  return map;
}

async function buildMap(input) {
  const lines = input.split('\n');
  const sections = getSections(lines);
  return sections;
}

function getSections(lines) {
  const sections = getArray(lines, 'BUILDKITE_PLUGIN_POST_POST_');
  return sections
    .map(section => {
      const when = getWhen(section);
      const pipeline = getPipeline(section);
      return {
        [when]: pipeline
      };
    });
}

function getWhen(lines) {
  let targets = lines.map(line => parseLine(line))
    .filter(obj => obj.key === 'when');

  return targets[0].value;
}

function getPipeline(lines) {
  let targets = lines.map(line => parseLine(line))
    .filter(obj => obj.key === 'pipeline');

  // const yml = targets[0].value.replace(/\\n/g, '\n');
  const yml = targets[0].value;
  return yaml.safeLoad(yml);
}

function getArray(lines, prefix) {
  const cleanLines = lines
    .filter(line => line.startsWith(prefix))
    .map(line => line.replace(prefix, ''))

  return toArray(cleanLines, '_');
}

function parseLine(line) {
  let index = line.indexOf('=');
  return {
    key: line.substring(0, index).toLowerCase(),
    value: line.substring(index + 1)
  }
}

function toArray(lines, prefix) {
  return lines.reduce((memo, line) => {
    let index = line.indexOf(prefix);
    let itemIndex = parseInt(line.substring(0, index));
    let itemValue = line.substring(index + 1);

    const section = memo[itemIndex] || [];
    section.push(itemValue);
    memo[itemIndex] = section;
    return memo;
  }, [])
}

// From https://github.com/sindresorhus/get-stdin
// MIT LICENSED
function getStdin() {
  return new Promise(resolve => {
    const stdin = process.stdin;
    let ret = '';

    if (stdin.isTTY) {
      return resolve(ret);
    }

    stdin.setEncoding('utf8');

    stdin.on('readable', () => {
      let chunk;

      while ((chunk = stdin.read())) {
        ret += chunk;
      }
    });

    stdin.on('end', () => resolve(ret));
  });
}
