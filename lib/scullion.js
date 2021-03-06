'use strict';

const fs = require('fs');
const path = require('path');

const fsUtils = require('./utils/fsUtils.js');
const logger = require('./logger');

const fileName = 'piscosour';

const _elements = [
  'plugins',
  'steps',
  'flows',
  'contexts'
];

const requireConfig = (moduleName) => {
  let config = undefined;
  try {
    config = require(moduleName);
    logger.trace('reading:', '#green', moduleName);
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') {
      logger.warn(`error reading ${moduleName} =>`, '#red', err);
      throw err;
    }
  } //eslint-disable-line no-empty
  return config;
};

const loadConfigs = (rootDir) => {
  const configs = [];
  if (fsUtils.exists(rootDir)) {
    fs.readdirSync(rootDir).forEach((dir) => {
      const config = requireConfig(path.join(rootDir, dir, 'config'));
      if (config) {
        config._module = path.join(rootDir, dir);
        configs.push(config);
      }
    });
  }

  return configs;
};

const loadElements = (recipe, element) => {

  const _loadSteps = (config) => {
    let contexts = config.contexts;
    if (!contexts) {
      logger.warn('#yellow', 'step', '#bold', config.name, '#yellow', 'from recipe', '#bold', recipe.name, '#yellow', 'is not available: no contexts declared');
    } else {
      if (contexts === '*') {
        contexts = [ 'default' ];
      }
      recipe[element][config.name] = recipe[element][config.name] || {};
      contexts.forEach(context => recipe[element][config.name][context] = config);
    }
  };
  const _loadFlows = (config) => {
    recipe[element][config.name] = config;
    if (!recipe[element][config.name].type) {
      recipe[element][config.name].type = 'normal';
    }
  };
  const _loadOther = config => recipe[element][config.name] = config;
  const _load = {
    steps: _loadSteps,
    flows: _loadFlows,
    plugins: _loadOther,
    contexts: _loadOther
  };

  recipe[element] = recipe[element] || {};
  loadConfigs(path.join(recipe.dir, element)).forEach(config => _load[element](config));

  return recipe;
};

const cook = function(recipes) {
  logger.trace('#magenta', 'Scullion is cooking all recipes');
  Object.getOwnPropertyNames(recipes).forEach((name) => {
    let recipe = recipes[name];
    logger.trace('cooking:', '#green', recipe.name ? recipe.name : name, 'dir:', recipe.dir);

    recipe.config = requireConfig(path.join(recipe.dir, fileName)) || {};

    if (recipe.name) {
      _elements.forEach((element) => {
        recipe = loadElements(recipe, element);
      });
    }
  });

  return {
    recipes: recipes
  };
};

/**
 * **Internal:**
 *
 * Prepare the config object to be use by the config module.
 *
 * @returns {{recipes, rootDir}}
 * @module scullion
 */
module.exports = {
  cook: cook,
  get elements() {
    return _elements;
  }
};
