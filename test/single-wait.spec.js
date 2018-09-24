const utils = require('./utils');
const plugin = require('..');

const NAME = plugin.NAME;

describe('Build pipeline with multiple steps with wait', () => {

  it('should build a success with 1:wait:1', () => {
    const steps = utils.getSteps(`
post:
  - when: success
    steps: |
      - label: step1
        command: step1.sh
      - wait
      - label: step2
        command: step2.sh
`);

    const pipeline = plugin.getPipeline('success', steps);
    expect(pipeline).toEqual(`steps:
  - label: step1
    command: step1.sh
    plugins:
      '${NAME}':
        post:
          - when: success
            steps: |
              - label: step2
                command: step2.sh
`
    );
  });

  it('should build a success with 1:wait:*', () => {
    const steps = utils.getSteps(`
post:
  - when: success
    steps: |
      - label: step1
        command: step1.sh
      - wait
      - label: step2
        command: step2.sh
      - label: step3
        command: step3.sh
`);

    const pipeline = plugin.getPipeline('success', steps);
    expect(pipeline).toEqual(`steps:
  - label: step1
    command: step1.sh
    plugins:
      '${NAME}':
        post:
          - when: success
            steps: |
              - label: step2
                command: step2.sh
              - label: step3
                command: step3.sh
`
    );
  });


  it('should build a success with 1:wait:1:wait:1', () => {
    const steps = utils.getSteps(`
post:
  - when: success
    steps: |
      - label: step1
        command: step1.sh
      - wait
      - label: step2
        command: step2.sh
      - wait
      - label: step3
        command: step3.sh
`);

    const pipeline = plugin.getPipeline('success', steps);
    expect(pipeline).toEqual(`steps:
  - label: step1
    command: step1.sh
    plugins:
      '${NAME}':
        post:
          - when: success
            steps: |
              - label: step2
                command: step2.sh
                plugins:
                  '${NAME}':
                    post:
                      - when: success
                        steps: |
                          - label: step3
                            command: step3.sh
`
    );
  });

});
