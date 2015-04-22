var config = require('../../package.json').babelBoilerplateOptions;

global.d3 = require('d3');
global.koto = require('koto');
global.mocha.setup('bdd');
global.onload = function() {
  global.mocha.checkLeaks();
  global.mocha.globals(config.mochaGlobals);
  global.mocha.run();
  require('./setup')();
};
