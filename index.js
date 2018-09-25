#!/usr/bin/env node

const yaml = require('js-yaml');
const pkg = require('./package.json')

const PREFIX = 'BUILDKITE_PLUGIN_POST_POST';
const NAME = `jmendiara/post#${pkg.version}`

module.exports = {
  PREFIX,
  NAME,
  getPipeline,
}

function getPipeline(when, steps) {
  const POSSIBLE_WHENS = ['success', 'failure'];
  if (!POSSIBLE_WHENS.includes(when)) {
    throw new Error(`"when: ${when}" is not recognized. Available when are "${POSSIBLE_WHENS}"`);
  }

  const stepsMap = rebuildSteps(steps);
  const originalPipeline = stepsMap[when];

  if (!originalPipeline) {
    throw new Error(`There is not a "${when}" post defined`);
  }

  const pipeline = generatePipeline(originalPipeline);
  return yaml.safeDump(pipeline);
}

function generatePipeline(pipeline) {
  const { steps } = pipeline;
  const hasWait = hasWaits(steps);
  if (!hasWait) {
    return pipeline;
  } else {
    let index = getWaitIndex(steps);
    let newSteps;
    if (index !== 1) {
      throw new Error('Unsupported post layout. There must be only one step before the wait one');
    }
    const preWaitSteps = steps.slice(0, index);
    newSteps = wrapIntoPluginStep(steps.slice(index + 1), preWaitSteps[0])

    pipeline.steps = [ newSteps ];

  }
  return pipeline;
}

function wrapIntoPluginStep(steps, dest) {
  let newSteps;
  if (!hasWaits(steps)) {
    newSteps = steps;
  } else {
    const pipeline = generatePipeline({ steps });
    newSteps = pipeline.steps;
  }

  return Object.assign({}, dest, {
    plugins: {
      [`${NAME}`]: {
        post: [{
          when: 'success',
          steps: yaml.safeDump(newSteps),
        }]
      }
    }
  });
}

function rebuildSteps(dirtySteps) {
  let steps = {};
  for (let i = 0, step; step = getStageAtIndex(i, dirtySteps); i++) {
    Object.assign(steps, step);
  }
  return steps;
}

function getStageAtIndex(index, map) {
  const whenIndex = `${PREFIX}_${index}_WHEN`;
  const stepsIndex = `${PREFIX}_${index}_STEPS`;

  if (map[whenIndex] && map[stepsIndex]) {
    return {
      [map[whenIndex]]: {
        steps: yaml.safeLoad(map[stepsIndex])
      }
    }
  } else if (map[whenIndex] || map[stepsIndex]) {
    throw new Error('"post" object must include both "when" and "steps" properties');
  }
}

function hasWaits(steps) {
  return steps.some(step => isWaitStep(step));
}

function getWaitIndex(steps) {
  return steps.findIndex(step => isWaitStep(step));
}
function isWaitStep(step) {
  return isSuccessWait(step) || isAlwaysWait(step);
}

function isSuccessWait(step) {
  return step === 'wait';
}

function isAlwaysWait(step) {
  return 'wait' in step;
}
