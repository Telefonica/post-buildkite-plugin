const utils = require('./utils');
const plugin = require('../index');

const PREFIX = plugin.PREFIX;

describe('Test Utilitites', () => {
  it('should convert objects to env vars', () => {

    const map = utils.objToEnv({
      post: [
        {
          when: 'success',
          steps: '- label: "OK"\n  command: success.sh\n',
        },
        {
          when: 'failure',
          steps: '- label: "KO"\n  command: failure.sh\n'
        },
      ],
    });

    expect(map).toStrictEqual({
      [`${PREFIX}_0_WHEN`]: 'success',
      [`${PREFIX}_0_STEPS`]: '- label: "OK"\n  command: success.sh\n',
      [`${PREFIX}_1_WHEN`]: 'failure',
      [`${PREFIX}_1_STEPS`]: '- label: "KO"\n  command: failure.sh\n',
    });
  });

  it('should load fixtures', () => {
    const map = utils.getSteps(`
post:
  - when: success
    steps: |
      - command: success.sh
`);
    expect(map).toStrictEqual({
      [`${PREFIX}_0_WHEN`]: 'success',
      [`${PREFIX}_0_STEPS`]: '- command: success.sh\n',
    });
  });
});
