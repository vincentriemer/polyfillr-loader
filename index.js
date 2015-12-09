var path = require('path');
var webpack = require('webpack');
var Combinatorics = require('js-combinatorics');
var async = require('async');

function MyPlugin(options) {
  this.path = options.path;
  this.polyfills = options.polyfills;
}

MyPlugin.prototype.apply = function (compiler) {
  var assetPath = this.path;
  var polyfillList = this.polyfills; // TODO: detect polyfills instead of using list
  var sourcePath = path.join(compiler.options.output.path, compiler.options.output.filename);

  compiler.plugin('after-emit', function (compilation, finalCallback) {
    var bundleFunctions = [];
    var cmb = Combinatorics.power(polyfillList);

    cmb.forEach(function (bundlePolyfills) {
      var filename = bundlePolyfills.map(function (value) {
        return value.replace(/\W/g, '');
      }).join('.');
      if (filename.length !== 0) {
        filename += '.';
      }
      filename += 'bundle.js';

      bundlePolyfills.push(sourcePath);
      bundleFunctions.push(function (callback) {
        webpack({
          entry: bundlePolyfills,
          output: {
            path: assetPath,
            filename: filename
          },
          plugins: [
            new webpack.optimize.UglifyJsPlugin(),
            new webpack.optimize.DedupePlugin()
          ]
        }, function (err, stats) {
          console.log(stats.toString({chunks: false}));
          callback();
        });
      });
    });

    async.series(bundleFunctions, finalCallback);
  });
}

module.exports = MyPlugin;