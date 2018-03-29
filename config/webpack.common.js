'use strict';

// tslint:disable:max-file-line-count

const webpack = require('webpack');
const helpers = require('./helpers');
const versionNumber = require('./version-number').versionNumber;

/*
 * Webpack Plugins
 */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlElementsPlugin = require('./html-elements-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExtractToCssFilePlugin = new ExtractTextPlugin({filename:'[name].css', allChunks:true});
const AssetsPlugin = require('assets-webpack-plugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const {NgcWebpackPlugin} = require('ngc-webpack');

/*
 * Webpack Constants
 */
const METADATA = {
  title: 'Portal',
  baseUrl: '/',
  isAotBuild: false,
};


/*
 * Webpack configuration
 *
 * See: https://webpack.js.org/api/cli/
 */
module.exports = function (metadata) {
  const isProd = metadata.ENV === 'production';

  return {
    /*
     * Cache generated modules and chunks to improve performance for multiple incremental builds.
     * This is enabled by default in watch mode.
     * You can pass false to disable it.
     *
     * See: https://webpack.js.org/configuration/other-options/#cache
     */
    // cache: false,

    watchOptions: {aggregateTimeout: 500},

    /*
     * The entry point for the bundle
     * Our Angular.js app
     *
     * See: https://webpack.js.org/configuration/entry-context/#entry
     */
    entry: Object.assign(
      {
        polyfills: helpers.root('src', 'common', 'polyfills.browser.ts'),
        vendor: helpers.root('src', 'common', metadata.isAotBuild ? 'vendor.browser.aot.ts' : 'vendor.browser.ts'),
        cache: helpers.root('src', 'common', 'cache.browser.ts'),
        app: ['src', 'app'],
      },
    ),

    /*
     * Options affecting the resolving of modules.
     *
     * See: https://webpack.js.org/configuration/resolve/
     */
    resolve: {
      /*
       * An array of extensions that should be used to resolve modules.
       *
       * See: https://webpack.js.org/configuration/resolve/#resolve-extensions
       */
      extensions: ['.ts', '.js', '.json'],

      // An array of directory names to be resolved to the current directory
      modules: [helpers.root('src'), helpers.root('node_modules')],
    },

    /*
     * Options affecting the normal modules.app
     *
     * See: https://webpack.js.org/configuration/module/
     */
    module: {

      /*
       * An array of automatically applied rules.
       *
       * See: https://webpack.js.org/configuration/module/#rule
       */
      rules: [
        /*
         * Tslint loader support for *.ts files
         *
         * See: https://github.com/wbuchwalter/tslint-loader
         */
        {
          test: /\.ts$/,
          loader: 'tslint-loader',
          enforce: 'pre',
          exclude: [helpers.root('node_modules')],
        },

        /*
         * Source map loader support for *.js files
         * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
         *
         * See: https://webpack.js.org/loaders/source-map-loader/
         */
        {
          test: /\.js$/,
          enforce: 'pre',
          loader: 'source-map-loader',
          // angular's source maps seem to be broken
          exclude: [helpers.root('node_modules', '@angular', 'compiler', '@angular', 'compiler.es5.js')],
        },

        /*
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         * Replace templateUrl and stylesUrl with require()
         *
         * See: https://github.com/AngularClass/angular2-hmr-loader
         * See: https://github.com/s-panferov/awesome-typescript-loader
         * See: https://github.com/TheLarkInn/angular2-template-loader
         */
        {
          test: /\.ts$/,
          use: [
            ...(isProd ? [] : ['@angularclass/hmr-loader']),
            { // MAKE SURE TO CHAIN VANILLA JS CODE, I.E. TS COMPILATION OUTPUT.
              loader: 'ng-router-loader',
              options: {
                loader: 'async-import',
                genDir: 'aot',
                aot: metadata.isAotBuild,
              },
            },
			{
			  loader : 'ts-loader',
			  options: {
				 // disable type checker - we will use it in fork plugin
				 transpileOnly: true,
				 happyPackMode: true
			  }
		    },
		    {
			  loader: 'angular2-template-loader'
			}
          ],
          exclude: /\.(spec)\.ts$/,
        },

        {
          test: /\.(svg|png|jpg|gif)$/,
          loader: 'file-loader',
          options: {
            limit: 75000,
          },
        },

        /*
         * To string and css loader support for *.css files
         * Returns file content as string
         */
        {
          test: /\.css$/,
          use: [
            'to-string-loader',
            'css-loader',
            'postcss-loader',
          ],
        },

        {
          test: /\.less$/,
          use: [
            'to-string-loader',
            'css-loader',
            'postcss-loader',
            {
              loader: 'less-loader',
              options: {
                dumpLineNumbers: 'comments',
                strictUnits: true,
              },
            },
          ],
          exclude: [/node_modules/, /\.global\.less$/],
        },

        /*
         * Raw loader support for *.html
         * Returns file content as string
         *
         * See: https://webpack.js.org/loaders/raw-loader/
         */
        {
          test: /\.html$/,
          loader: 'raw-loader',
        },

        {
          test: /\.js$/,
          loader: 'string-replace-loader',
          enforce: 'post',
          options: {
            search: 'var sourceMappingUrl = extractSourceMappingUrl\\(cssText\\);',
            replace: 'var sourceMappingUrl = "";',
            flags: 'g',
          },
        },
      ],
    },

    /*
     * Add additional plugins to the compiler.
     *
     * See: https://webpack.js.org/configuration/plugins/
     */
    plugins: [
      /*
       * Plugin: ContextReplacementPlugin
       * Description: Provides context to Angular's use of System.import
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#contextreplacementplugin
       * See: https://github.com/angular/angular/issues/11580
       */
      new ContextReplacementPlugin(
        // The [\\/] piece accounts for path separators in *nix and Windows
        /angular[\\/](core|compiler)[\\/]@angular/,
        helpers.root('src') // location of your src
      ),

      ExtractToCssFilePlugin,

      new AssetsPlugin({
        path: helpers.root('dist'),
        filename: 'webpack-assets.json',
        prettyPrint: true,
      }),

      /*
       * Plugin: CommonsChunkPlugin
       * Description: Shares common code between the pages.
       * It identifies common modules and put them into a commons chunk.
       *
       * See: https://webpack.js.org/plugins/commons-chunk-plugin/
       */
      new webpack.optimize.CommonsChunkPlugin({
        name: ['app', 'vendor', 'polyfills'],
      }),

      /*
       * Plugin: CopyWebpackPlugin
       * Description: Copy files and directories in webpack.
       *
       * Copies project static assets.
       *
       * See: https://github.com/kevlened/copy-webpack-plugin
       */
      new CopyWebpackPlugin([{
        from: helpers.root('src', 'assets'),
        to: 'assets',
      }]),

      /*
       * Plugin: HtmlWebpackPlugin
       * Description: Simplifies creation of HTML files to serve your webpack bundles.
       * This is especially useful for webpack bundles that include a hash in the filename
       * which changes every compilation.
       *
       * See: https://github.com/ampedandwired/html-webpack-plugin
       */

      /*
       * Dev Index.html
       */
      new HtmlWebpackPlugin({
        metadata,
        title: 'ng4 Sample',
        filename: 'index.html',
        template: helpers.root('src', 'app', 'index.html'),
        chunks: [],
      }),
    ],
  };
};

module.exports.METADATA = METADATA;
