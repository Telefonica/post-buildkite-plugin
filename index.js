
const yaml = require('js-yaml');

main()
  .then(ret => console.log(ret))
  .catch(err => { console.error(err); process.exit(1); })

async function main() {
  const input = await getStdin();
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
  return sections.map(section => {
    const when = getWhen(section);
    const steps = getSteps(section);
    console.log(when, steps);

    return section;

  });
}

function getWhen(lines) {
  let targets = lines.map(line => parseLine(line))
    .filter(obj => obj.key === 'when');

  return targets[0].value;
}

function getSteps(lines) {
  let targets = lines.map(line => parseLine(line))
    .filter(obj => obj.key === 'steps');

  return yaml.safeLoad(targets[0].value);
}

function getArray(lines, prefix) {
  const cleanLines = lines
    .filter(line => line.startsWith(prefix))
    .map(line => line.replace(prefix, ''))

  return toArray(cleanLines, '_');
}

function toMap(lines) {
  return lines
    .map(line => parseLine(line))
    .reduce((memo, obj) => Object.assign(memo, {
      [obj.key]: obj.value,
    }), {});
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
