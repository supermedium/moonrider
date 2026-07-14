var fs = require('fs');
var ip = require('ip');
var path = require('path');
var webpack = require('webpack');
var COLORS = require('./src/constants/colors.js');

var PLUGINS = [
  new webpack.EnvironmentPlugin({
    DEBUG_LOG: '',
    NODE_ENV: 'development'
  }),
  // @firebase/polyfill not loading, stub it with some random module.
  new webpack.NormalModuleReplacementPlugin(
    /firebase\/polyfill/,
    '../../../../src/constants/colors.js'
  )
];

module.exports = {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  devServer: {
    allowedHosts: 'all',
    liveReload: true,
    hot: false,
    server: 'https',
    static: {
      directory: __dirname
    },
    watchFiles: ['src/**', 'index.html']
  },
  entry: {
    build: './src/index.js',
    zip: './src/workers/zip.js'
  },
  output: {
    globalObject: 'this',
    path: path.resolve(__dirname, 'build'),
    publicPath: 'auto',
    filename: '[name].js'
  },
  plugins: PLUGINS,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: ['babel-loader', 'aframe-super-hot-loader']
      },
      {
        test: /\.json/,
        exclude: /(node_modules)/,
        type: 'json'
      },
      {
        test: /\.html/,
        exclude: /(node_modules)/,
        use: [
          'aframe-super-hot-html-loader',
          {
            loader: 'super-nunjucks-loader',
            options: {
              globals: {
                DEBUG_AFRAME: !!process.env.DEBUG_AFRAME,
                DEBUG_LOG: !!process.env.DEBUG_LOG,
                DEBUG_KEYBOARD: !!process.env.DEBUG_KEYBOARD,
                DEBUG_INSPECTOR: !!process.env.DEBUG_INSPECTOR,
                HOST: ip.address(),
                IS_PRODUCTION: process.env.NODE_ENV === 'production',
                COLORS: COLORS
              },
              path: path.resolve(__dirname, 'src')
            }
          },
          {
            loader: 'html-require-loader',
            options: {
              root: path.resolve(__dirname, 'src')
            }
          }
        ]
      },
      {
        test: /\.glsl/,
        exclude: /(node_modules)/,
        loader: 'webpack-glsl-loader'
      },
      {
        test: /\.css$/,
        exclude: /(node_modules)/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg)/,
        type: 'asset'
      }
    ]
  },
  resolve: {
    modules: [path.join(__dirname, 'node_modules')]
  },
  // A-Frame ships three.js and exposes it as window.THREE.
  // Stub `import ... from 'three'` (used by some components) so it resolves
  // to that global instead of bundling a second copy.
  externals: {
    three: 'THREE'
  }
};
