var path = require('path');
var webpack = require('webpack');
var Combinatorics = require('js-combinatorics');
var async = require('async');
var polyDefs = require('polyfillr-definitions');
var acorn = require('acorn');
var colors = require('colors');
var fs = require('fs');
var Modernizr = require('modernizr');
var ejs = require('ejs');
var progress = require('progress');

var generateBundleName = require('./generateBundleName');

// CREDIT: http://stackoverflow.com/a/1584377/3105183
function arrayUnique(array) {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j])
        a.splice(j--, 1);
    }
  }
  return a;
}

function removeIgnored(input, ignored) {
  return input.filter(function(value) {
    return ignored.indexOf(value) === -1;
  });
}

function MyPlugin(options) {
  this.path = options.path || '';
  this.publicPath = options.publicPath || '';
  this.exclude = options.exclude || [];
  this.include = options.include || [];
  this.minify = options.minify == null ? true : options.minify;
}

MyPlugin.prototype.apply = function (compiler) {
  var assetPath = this.path;
  var testList = [];
  var publicPath = this.publicPath;
  var sourcePath = path.join(compiler.options.output.path, compiler.options.output.filename);
  var exclude = this.exclude;
  var include = this.include;
  var minify = this.minify;

  compiler.plugin('after-emit', function (compilation, finalCallback) {
    var detectionString = fs.readFileSync(sourcePath, 'utf8');
    var detectedTests = arrayUnique(polyDefs.test(acorn.parse(detectionString, {emcaVersion: 6})));

    // always include es5 as a baseline
    include.push('test/es5/specification');

    if (detectedTests.length !== 0) {
      console.log('\nDETECTED THE FOLLOWING TESTS'.bold.underline);
      console.log('NOTE: if any of these are false positives add them to the '.yellow +
        'exclude'.bold.yellow +
        ' option in the pollyfillr plugin'.yellow);
      detectedTests.forEach(function(test) {
        console.log(test.magenta);
      });
      testList = testList.concat(detectedTests);
    }

    if (include.length !== 0) {
      console.log('\nINCLUDING THE FOLLOWING TESTS'.bold.underline);
      include.forEach(function(test) {
        console.log(test.magenta);
      });
      testList = include.concat(testList);
    }

    if (exclude.length !== 0) {
      console.log('\nEXCLUDING THE FOLLOWING TESTS'.bold.underline);
      exclude.forEach(function (test) {
        console.log(test.magenta);
      });
      testList = removeIgnored(testList, exclude);
    }

    // remove any duplicate tests
    testList = arrayUnique(testList);

    console.log('\nGENERATING BUNDLES WITH FOLLOWING TESTS'.bold.underline);
    testList.forEach(function (test) {
      console.log(test.magenta);
    });
    console.log('');

    var bundleFunctions = [];
    var cmb = Combinatorics.power(testList);

    console.log('GENERATING BUNDLES'.bold.underline);
    var bar = new progress('[:bar] :percent :etas', {
      total: cmb.length + 1,
      complete: '=',
      incomplete: ' ',
      width: 50
    });

    var plugins = [];

    if (minify) {
      plugins.push(new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } }));
    }

    cmb.forEach(function (bundleTests) {
      var bundlePolyfills = [];
      var bundleProperties = [];
      bundleTests.forEach(function (test) {
        if (!polyDefs.polyfills.hasOwnProperty(test)) {
          throw 'Test ' + test + ' not mapped in polyfill definition';
        }
        bundlePolyfills.push(polyDefs.polyfills[test].polyfill);
        bundleProperties.push(polyDefs.polyfills[test].property);
      });

      var filename = generateBundleName(bundleProperties);

      bundlePolyfills.push(sourcePath);
      bundleFunctions.push(function (callback) {
        webpack({
          entry: bundlePolyfills,
          output: {
            path: assetPath,
            filename: filename
          },
          plugins: plugins
        }, function (err, stats) {
          bar.tick();
          callback();
        });
      });
    });

    var allProperties = testList.map(function (test) {
      return polyDefs.polyfills[test].property;
    });

    bundleFunctions.push(function (callback) {
      var template = fs.readFileSync(path.join(__dirname, 'entry.ejs'), 'utf8');
      Modernizr.build({'feature-detects': testList}, function (result) {
        var render = ejs.render(template, {
          modernizrBuild: result,
          properties: allProperties,
          publicPath: publicPath
        });
        var tempEntryPath = path.join(assetPath, 'temp-entry.js');

        fs.writeFileSync(tempEntryPath, render);

        webpack({
          entry: tempEntryPath,
          output: {
            path: assetPath,
            filename: 'entry.js'
          },
          plugins: plugins
        }, function (err, stats) {
          bar.tick();
          fs.unlink(tempEntryPath, callback);
        });
      });
    });

    async.series(bundleFunctions, function() {
      console.log('\n');
      finalCallback();
    });
  });
};

module.exports = MyPlugin;