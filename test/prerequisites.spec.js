const utils = require('./utils');
const plugin = require('..');

describe('Execution prerequisites', () => {
  it('should return no pipeline when asking for unwanted when', () => {
    const steps = utils.getSteps(`
  post:
    - when: failure
      steps: |
        - label: step1
          command: step1.sh
  `);

    const pipeline = plugin.pipeline('success', steps);
    expect(pipeline).toEqual(undefined);
  });

  it('should fail when declaring an unknown when', () => {
    const steps = utils.getSteps(`
  post:
    - when: wtf
      steps: |
        - label: step1
          command: step1.sh
  `);

    expect(() => {
      plugin.pipeline('success', steps);
    }).toThrow(/"when: wtf" is not recognized./);
  });

  it('should fail when getting an unknown when', () => {
    const steps = utils.getSteps(`
  post:
    - when: success
      steps: |
        - label: step1
          command: step1.sh
  `);

    expect(() => {
      plugin.pipeline('wtf', steps);
    }).toThrow(/"when: wtf" is not recognized./);
  });

  it('should fail with missing when', () => {
    const steps = utils.getSteps(`
  post:
    - steps: |
        - label: step1
          command: step1.sh
  `);

    expect(() => {
      plugin.pipeline('success', steps);
    }).toThrow(/"post" object must include/);
  });

  it('should fail with missing steps', () => {
    const steps = utils.getSteps(`
  post:
    - when: success
  `);

    expect(() => {
      plugin.pipeline('success', steps);
    }).toThrow(/"post" object must include/);
  });

  it('should fail with missing config', () => {
    const steps = utils.getSteps(``);

    expect(() => {
      plugin.pipeline('success', steps);
    }).toThrow(/Missing plugin config/);
  });

  it('should fail with wait on failure', () => {
    const steps = utils.getSteps(`
  post:
  - when: failure
    steps: |
      - label: step1
        command: step1.sh
        wait: ~

`);

    expect(() => {
      plugin.pipeline('failure', steps);
    }).toThrow(/Unsupported post layout/);
  });

  it('should fail with paralallel jobs', () => {
    const steps = utils.getSteps(`
  post:
  - when: failure
    steps: |
      - label: step1
        command: step1.sh
        parallelism: 2

`);

    expect(() => {
      plugin.pipeline('failure', steps);
    }).toThrow(/Unsupported post layout/);
  });

  it('should fail with implicit paralallel jobs', () => {
    const steps = utils.getSteps(`
  post:
  - when: failure
    steps: |
      - label: step1
        command: step1.sh
        parallelism: 2
`);

    expect(() => {
      plugin.pipeline('failure', steps);
    }).toThrow(/Unsupported post layout/);
  });

  it('should fail with explicit paralallel jobs', () => {
    const steps = utils.getSteps(`
  post:
  - when: failure
    steps: |
      - label: step1
        command: step1.sh
      - label: step1
        command: step1.sh
      - wait
      - label: step1
        command: step1.sh
`);

    expect(() => {
      plugin.pipeline('failure', steps);
    }).toThrow(/Unsupported post layout/);
  });
});
