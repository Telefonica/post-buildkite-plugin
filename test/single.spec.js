const utils = require('./utils');
const plugin = require('..');

describe('Build pipeline with single steps without wait', () => {
  it('should build a success', () => {
    const steps = utils.getSteps(`
post:
  - when: success
    steps: |
      - label: step1
        command: step1.sh
`);

    const pipeline = plugin.pipeline('success', steps);
    expect(pipeline).toEqual(`steps:
  - label: step1
    command: step1.sh
`);
  });

  it('should build a failure', () => {
    const steps = utils.getSteps(`
post:
  - when: failure
    steps: |
      - label: step1
        command: step1.sh
`);

    const pipeline = plugin.pipeline('failure', steps);
    expect(pipeline).toEqual(`steps:
  - label: step1
    command: step1.sh
`);
  });
});
