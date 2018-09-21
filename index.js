


// From https://github.com/sindresorhus/get-stdin
// MIT LICENSED
const getStdin = () => new Promise(resolve => {
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

getStdin().then(ret => console.log(ret));
