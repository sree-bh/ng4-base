'use strict';

const webpack = require('webpack');
const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
const commonConfig = require('./webpack.common.js'); // the settings that are common to prod and dev
const argv = require('yargs').argv;
const fs = require('fs');

/**
 * Webpack Plugins
 */
const DefinePlugin = require('webpack/lib/DefinePlugin');
const NamedModulesPlugin = require('webpack/lib/NamedModulesPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'development';
const HOST = process.env.HOST || '0.0.0.0';
const PORT = process.env.PORT || 3000;
const HMR = argv.hot;
const STAGE = process.env.MVP_DEPLOYMENT_STAGE || 'dev';
const METADATA = webpackMerge(commonConfig.METADATA, {
  host: HOST,
  port: PORT,
  ENV,
  HMR,
});

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function () {
  return webpackMerge(commonConfig(METADATA), {

    /**
     * Developer tool to enhance debugging
     *
     * See: https://webpack.js.org/configuration/devtool/
     */
    // devtool: 'cheap-module-source-map',
    devtool: 'inline-source-map',

    /**
     * Options affecting the output of the compilation.
     *
     * See: https://webpack.js.org/configuration/output/
     */
    output: {

      /**
       * The output directory as absolute path (required).
       *
       * See: https://webpack.js.org/configuration/output/#output-path
       */
      path: helpers.root('dist'),

      /**
       * Specifies the name of each output file on disk.
       * IMPORTANT: You must not specify an absolute path here!
       *
       * See: https://webpack.js.org/configuration/output/#output-filename
       */
      filename: '[name].bundle.js',

      /**
       * The filename of the SourceMaps for the JavaScript files.
       * They are inside the output.path directory.
       *
       * See: https://webpack.js.org/configuration/output/#output-sourcemapfilename
       */
      sourceMapFilename: '[name].map',

      /** The filename of non-entry chunks as relative path
       * inside the output.path directory.
       *
       * See: https://webpack.js.org/configuration/output/#output-chunkfilename
       */
      chunkFilename: '[id].chunk.js',

      library: 'ac_[name]',
      libraryTarget: 'var',
    },

    plugins: [

      new webpack.LoaderOptionsPlugin({
        options: {

          /**
           * Static analysis linter for TypeScript advanced options configuration
           * Description: An extensible linter for the TypeScript language.
           *
           * See: https://github.com/wbuchwalter/tslint-loader
           */
          tslint: {
            emitErrors: false,
            failOnHint: false,
            resourcePath: 'src',
            fix: true,
          },

        },
      }),

      /**
       * Plugin: DefinePlugin
       * Description: Define free variables.
       * Useful for having development builds with debug logging or adding global constants.
       *
       * Environment helpers
       *
       * See: https://webpack.js.org/plugins/define-plugin/
       */
      // NOTE: when adding more properties, make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        ENV: JSON.stringify(METADATA.ENV),
        HMR: METADATA.HMR,
        STAGE: JSON.stringify(METADATA.stage),
        'process.env': {
          ENV: JSON.stringify(METADATA.ENV),
          NODE_ENV: JSON.stringify(METADATA.ENV),
          HMR: METADATA.HMR,
        },
      }),

      /**
       * Plugin: NamedModulesPlugin (experimental)
       * Description: Uses file names as module name.
       *
       * See: https://github.com/webpack/webpack/commit/a04ffb928365b19feb75087c63f13cadfc08e1eb
       */
      new NamedModulesPlugin(),
    ],

    /**
     * Webpack Development Server configuration
     * Description: The webpack-dev-server is a little node.js Express server.
     * The server emits information about the compilation state to the client,
     * which reacts to those events.
     *
     * See: https://webpack.js.org/configuration/dev-server/
     */
    devServer: {
      port: METADATA.port,
      host: METADATA.host,
      historyApiFallback: true,
      watchOptions: {
        aggregateTimeout: 500,
        poll: 1000,
      },
      https: {
        key: fs.readFileSync(`${__dirname}/cert/privkey.pem`),
        cert: fs.readFileSync(`${__dirname}/cert/server.crt`),
      },
    },

    /**
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.js.org/configuration/node/
     */
    node: {
      global: true,
      crypto: false,
      process: true,
      module: false,
      clearImmediate: false,
      setImmediate: false,
      Buffer: false,
    },

  });
};
