var path = require('path');
var Webpack = require('webpack');
var HtmlwebpackPlugin = require('html-webpack-plugin');
module.exports = {
    mode: '', development,
    entry: {
       "index": "./src/index.js"
    },
    output: {
      path: path.join(__dirname, "dist"),
      filename: "main.js",
    },
    devServer: {
        contentBase: path.join(__dirname, "dist"),
    },
    plugins: [
      new HtmlwebpackPlugin({
        title: 'Hello HMR',
        filename: 'index.html',
        template: 'src/index.html',
      })
    ]
  };