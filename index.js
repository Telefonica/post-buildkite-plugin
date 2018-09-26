/**
 * @license
 * Copyright 2018 Telefónica
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const yaml = require('js-yaml');
const pkg = require('./package.json');

const PREFIX = 'BUILDKITE_PLUGIN_POST_POST';
const NAME = `jmendiara/post#${pkg.version}`;

module.exports = {
  PREFIX,
  NAME,
  pipeline,
};

/**
 * Creates a buildkite pipeline for the command status code, from
 * those specified in the plugin config
 *
 * @param {string} when the command exit status
 * @param {object} selializedConfig usually the process.env, where
 * buildkite serializes plugin configuration at runtime
 */
function pipeline(when, selializedConfig) {
  const POSSIBLE_WHENS = ['success', 'failure'];

  if (!POSSIBLE_WHENS.includes(when)) {
    throw new Error(`"when: ${when}" is not recognized. Available when are "${POSSIBLE_WHENS}"`);
  }

  const stepsMap = rebuildConfig(selializedConfig);
  const originalPipeline = stepsMap[when];

  // no pipeline has been defined for this type of
  if (!originalPipeline) {
    return;
  }

  const pipeline = transformPipeline(originalPipeline);
  return yaml.safeDump(pipeline);
}

/**
 * Transforms the pipeline specified in the steps config
 * to another one that can be used after a failure,
 * by adding one step at a time dinamically in the runtime
 *
 * When we add a pipeline dynamically, it's executed by buildkite
 * directly after the step that added it.
 *
 * But when a "wait" is found after a failure in this situation,
 * the execution will be aborted.
 *
 * Transforming the pipeline here uses this trick to add
 * steps one after another, making possible to have a serialized
 * pipelines with waits
 *
 * @example
 * ```yml
 *  - label: step1
 *    command: step1.sh
 *  - wait
 *  - label: step2
 *    command: step2.sh
 *
 * # Becomes
 * - label: step1
 *   command: step1.sh
 *   plugins:
 *     jmendiara/post#1.0.0:
 *       post:
 *         - when: success
 *           steps: |
 *             - label: step2
 *               command: step2.sh
 * ```
 * @param {object} pipeline builkite pipeline as a object
 */
function transformPipeline(pipeline) {
  const { steps } = pipeline;

  if (!areSupportedSteps(steps)) {
    throw new Error('Unsupported post layout. Can only have "wait" and "command" steps');
  }

  if (!hasWait(steps)) {
    // no waits, it can be executed safely by buildkite
    return pipeline;
  } else {
    let index = getWaitIndex(steps);
    let newSteps;

    if (index !== 1) {
      // we do not support parallel steps before a wait (yet!)
      throw new Error('Unsupported post layout. There must be only one step before "wait"');
    }

    // Drop the wait step and add the remaining steps wrapped in this plugin
    const preWaitSteps = steps.slice(0, index);
    newSteps = wrapIntoPluginStep(steps.slice(index + 1), preWaitSteps[0]);

    pipeline.steps = [newSteps];
  }
  return pipeline;
}

/**
 * Adds the steps as this plugin config in the provided destination step
 *
 * @param {array<object>} steps
 * @param {object} dest
 */
function wrapIntoPluginStep(steps, dest) {
  let newSteps;
  if (!hasWait(steps)) {
    newSteps = steps;
  } else {
    const pipeline = transformPipeline({ steps });
    newSteps = pipeline.steps;
  }

  return Object.assign({}, dest, {
    plugins: {
      [`${NAME}`]: {
        post: [
          {
            when: 'success',
            steps: yaml.safeDump(newSteps),
          },
        ],
      },
    },
  });
}

/**
 * Makes an object from a serialized buildkite plugin config
 *
 * @example
 * ```
 * {
 *   success: {  // when config prop as key. the value is a bk pipeline
 *     steps: [ ... ]}
 * }
 *
 * @param {*} config
 */
function rebuildConfig(config) {
  let steps = {};
  for (let i = 0, step; (step = getStageAtIndex(i, config)); i++) {
    Object.assign(steps, step);
  }
  return steps;
}

function getStageAtIndex(index, config) {
  const whenIndex = `${PREFIX}_${index}_WHEN`;
  const stepsIndex = `${PREFIX}_${index}_STEPS`;

  if (config[whenIndex] && config[stepsIndex]) {
    return {
      [config[whenIndex]]: {
        steps: yaml.safeLoad(config[stepsIndex]),
      },
    };
  } else if (config[whenIndex] || config[stepsIndex]) {
    throw new Error('"post" object must include both "when" and "steps" properties');
  }
}

function areSupportedSteps(steps) {
  return steps.every(
    step =>
      (isWaitStep(step) || isCommandStep(step) || isPluginStep(step)) &&
      !isParallelStep(step) &&
      !isWaitFailureStep(step)
  );
}

function hasWait(steps) {
  return steps.some(step => isWaitStep(step));
}

function getWaitIndex(steps) {
  return steps.findIndex(step => isWaitStep(step));
}

function isWaitStep(step) {
  return step === 'wait';
}

function isWaitFailureStep(step) {
  return step.hasOwnProperty('wait');
}

function isCommandStep(step) {
  return step.hasOwnProperty('command');
}

function isPluginStep(step) {
  return !isCommandStep() && step.hasOwnProperty('plugins');
}

function isParallelStep(step) {
  return step.hasOwnProperty('parallelism');
}
