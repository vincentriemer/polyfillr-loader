var webpack = require('webpack');
var path = require('path');
var Polyfillr = require('../index');

module.exports = {
  entry: './index.js',
  output: {
    path: path.join(__dirname, 'bundle'),
    filename: 'bundle.js'
  },
  plugins: [
    new Polyfillr({
      path: path.join(__dirname, 'assets')
    })
  ]
};