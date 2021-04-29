const path = require('path');

module.exports = {
  target: "es5",
  entry: path.resolve(__dirname, './src/index.js'),
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist'),
	library: 'Dryvue',
	libraryTarget: 'umd'
  },
  externals: { "vue": "vue" },
  module: {
    rules: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }]
  },
  plugins: [  ]
};
