const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const plugin = require('../index');

const PREFIX = plugin.PREFIX;

module.exports = {
  getSteps,
  objToEnv,
};

function getSteps(content) {
  const yml = yaml.safeLoad(content);
  return objToEnv(yml);
}

function objToEnv(obj) {
  obj = obj || { post: [] };
  return obj.post.reduce((memo, item, index, obj) => {
    Object.keys(item).forEach(key => (memo[`${PREFIX}_${index}_${key.toUpperCase()}`] = obj[index][key]));
    return memo;
  }, {});
}
