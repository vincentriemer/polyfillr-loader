var webpack = require('webpack');
var path = require('path');
var Polyfillr = require('./index');

module.exports = {
  entry: './test/test.js',
  output: {
    path: path.join(__dirname, 'test-assets'),
    filename: 'pre-bundle.js'
  },
  plugins: [
    new Polyfillr({
      path: path.join(__dirname, 'test-assets'),
      publicPath: 'test-assets',
      minify: false
    })
  ]
};