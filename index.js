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

// CREDIT: http://stackoverflow.com/a/1584377/3105183
function arrayUnique(array) {
    var a = array.concat();
    for(var i=0; i<a.length; ++i) {
        for(var j=i+1; j<a.length; ++j) {
            if(a[i] === a[j])
                a.splice(j--, 1);
        }
    }
    return a;
}

function MyPlugin(options) {
  this.path = options.path || '';
  this.tests = options.tests || [];
}

function generateBundleName(properties) {
  var separator = '.';
  if (properties.length === 0) { separator = ''; }
  return 'bundle' + separator + properties.join('.') + '.js';
}

MyPlugin.prototype.apply = function (compiler) {
  var assetPath = this.path;
  var testList = this.tests;
  var sourcePath = path.join(compiler.options.output.path, compiler.options.output.filename);

  compiler.plugin('after-emit', function (compilation, finalCallback) {
    var detectionString = compilation.assets[compiler.options.output.filename]._sourceResult;
    var detectedTests = polyDefs.test(acorn.parse(detectionString, { emcaVersion: 6 }));

    // always include es5 as a baseline
    testList = arrayUnique(['test/es5/specification'].concat(testList, detectedTests));

    console.log('\nGENERATING BUNDLES WITH FOLLOWING TESTS'.bold.underline);
    console.log('NOTE: if any of these are false positives add them to the ignore option in the pollyfillr plugin'.yellow);
    testList.forEach(function(test) {
      console.log(test.magenta);
    });
    console.log('');

    var bundleFunctions = [];
    var cmb = Combinatorics.power(testList);

    cmb.forEach(function (bundleTests) {
      var bundlePolyfills = [];
      var bundleProperties = [];
      bundleTests.forEach(function(test) {
        if (!polyDefs.polyfills.hasOwnProperty(test)) { throw 'Test ' + test + ' not mapped in polyfill definition'; }
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
          plugins: [
            new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
          ]
        }, function (err, stats) {
          console.log(stats.toString({ chunks: false, colors: true }));
          callback();
        });
      });
    });

    var allProperties = testList.map(function (test) {
      return polyDefs.polyfills[test].property;
    });

    bundleFunctions.push(function (callback) {
      var template = fs.readFileSync(path.join(__dirname, 'entry.ejs'), 'utf8');
      Modernizr.build({ 'feature-detects': testList }, function (result) {
        var render = ejs.render(template, { modernizrBuild: result, properties: allProperties });
        var tempEntryPath = path.join(assetPath, 'temp-entry.js');

        fs.writeFileSync(tempEntryPath, render);

        webpack({
          entry: tempEntryPath,
          output: {
            path: assetPath,
            filename: 'entry.js'
          },
          plugins: [
            new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false } })
          ]
        }, function(err, stats) {
          console.log(stats.toString({ chunks: false, colors: true }));
          fs.unlink(tempEntryPath, callback);
        });
      });
    });

    async.series(bundleFunctions, finalCallback);
  });
};

module.exports = MyPlugin;