var config = require('../../package.json').babelBoilerplateOptions;

global.mocha.setup('bdd');
global.d3 = require('d3');
global.Koto = require('koto');

global.onload = function() {
  global.mocha.checkLeaks();
  global.mocha.globals(config.mochaGlobals);
  
  if (global.mochaPhantomJS) {
    console.log('mocha-phantom');
    global.mochaPhantomJS.run();
  } else {
    global.mocha.run();
  }
  
  require('./setup')();
};
