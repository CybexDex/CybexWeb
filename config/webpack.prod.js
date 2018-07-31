const {
  loaders,
  resolve,
  plugins,
  BASE_URL,
  outputPath,
  externals,
  defines
} = require("./webpack.config");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const Clean = require("clean-webpack-plugin");
const PreloadWebpackPlugin = require("preload-webpack-plugin");
const path = require("path");
console.log("Webpack Config for Prod");
const webpack = require("webpack");
const UglifyPlugin = require("uglifyjs-webpack-plugin");
var OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const cssLoaders = [
  {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader"
      },
      {
        loader: "postcss-loader",
        options: {
          plugins: [require("autoprefixer")]
        }
      }
    ]
  },
  {
    test: /\.scss$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: "css-loader"
      },
      {
        loader: "postcss-loader",
        options: {
          plugins: [require("autoprefixer")],
          options: {
            minimize: true,
            debug: false
          }
        }
      },
      {
        loader: "sass-loader",
        options: {
          outputStyle: "expanded",
          minimize: true,
          debug: false
        }
      }
    ]
  }
];

// PROD OUTPUT PATH
let outputDir = "dist";
// outputPath =

// DIRECTORY CLEANER
var cleanDirectories = [outputDir];
const prodPlugins = plugins.concat([
  new HtmlWebpackPlugin({
    filename: "index.html",
    template: path.resolve(BASE_URL, "app/assets/index.html")
  }),
  new Clean(cleanDirectories, {
    root: BASE_URL
  }),
  new PreloadWebpackPlugin({
    rel: "prefetch"
  }),
  new webpack.DefinePlugin({
    "process.env": {
      NODE_ENV: JSON.stringify("production")
    },
    __DEV__: false,
    __PERFORMANCE_DEVTOOL__: false,
    __DEPRECATED__: false,
    ...defines
  }),
  new MiniCssExtractPlugin({
    // Options similar to the same options in webpackOptions.output
    // both options are optional
    filename: "[name]-[hash:7].css",
    chunkFilename: "[id]-[hash:7].css"
  })
  // new webpack.LoaderOptionsPlugin({
  //   minimize: true,
  //   debug: false
  // })
  // new webpack.optimize.ModuleConcatenationPlugin(),
]);

const config = {
  entry: {
    styles: path.resolve(BASE_URL, "app/assets/style-loader.js"),
    app: path.resolve(BASE_URL, "app/Main.js")
  },
  context: path.resolve(BASE_URL, "app"),
  output: {
    publicPath: "/",
    path: path.join(BASE_URL, outputDir),
    filename: "[name]-[hash:7].js",
    chunkFilename: "[name]-[chunkhash:7].js"
  },
  mode: "production",
  devtool: "none",
  module: {
    rules: loaders.concat(cssLoaders)
  },
  resolve,
  // externals,
  plugins: prodPlugins,
  node: {
    fs: "empty"
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        styles: {
          name: "styles",
          test: /\.css$/,
          chunks: "all",
          enforce: true
        },
        "components-account": {
          test: /components\/Account/,
          name: "components-account",
          chunks: "initial",
          enforce: true
        },
        "components-blockchain": {
          test: /components\/Blockchain/,
          name: "components-blockchain",
          chunks: "initial",
          enforce: true
        },
        "components-common": {
          test: /components\/Common/,
          name: "components-common",
          chunks: "initial",
          enforce: true
        },
        "components-exchange": {
          test: /components\/Exchange/,
          name: "components-exchange",
          chunks: "initial",
          enforce: true
        },
        "components-explorer": {
          test: /components\/Explorer/,
          name: "components-explorer",
          chunks: "initial",
          enforce: true
        },
        "components-settings": {
          test: /components\/Settings/,
          name: "components-settings",
          chunks: "initial",
          enforce: true
        },
        "components-wallet": {
          test: /components\/Wallet/,
          name: "components-wallet",
          chunks: "initial",
          enforce: true
        },
        "components-utility": {
          test: /components\/Utility/,
          name: "components-utility",
          chunks: "initial",
          enforce: true
        },
        "components-login": {
          test: /components\/Login/,
          name: "components-login",
          chunks: "initial",
          enforce: true
        },
        "components-layout": {
          test: /components\/Layout/,
          name: "components-layout",
          chunks: "initial",
          enforce: true
        },
        "lib-cybex": {
          test: /cybexjs|cybexjs-ws/,
          name: "lib-cybex",
          chunks: "initial",
          enforce: true
        },
        "lib-common": {
          test: /lib\/common/,
          name: "lib-common",
          chunks: "initial",
          enforce: true
        },
        "lib-translate": {
          test: /lib\/counterpart/,
          name: "lib-translate",
          chunks: "initial",
          enforce: true
        },
        "lib-chart": {
          test: /lib\/react-stockcharts/,
          name: "lib-chart",
          chunks: "initial",
          enforce: true
        },
        "lib-container": {
          test: /lib\/alt-react/,
          name: "lib-container",
          chunks: "initial",
          enforce: true
        },
        "lib-theme": {
          test: /lib\/react-foundation-apps/,
          name: "lib-chart",
          chunks: "initial",
          enforce: true
        },
        commons: {
          test: /node_modules\/[^(react)|(d3)]/,
          name: "commons",
          chunks: "initial",
          enforce: true
        },
        react: {
          test: /node_modules\/react.*/,
          name: "framework",
          chunks: "initial",
          enforce: true
        },
        d3: {
          test: /node_modules\/d3.*/,
          name: "d3",
          chunks: "initial",
          enforce: true
        }
      }
    },
    minimizer: [
      new UglifyPlugin({
        cache: true,
        parallel: true,
        extractComments: true,
        sourceMap: false // set to true if you want JS source maps
      }),
      new OptimizeCssAssetsPlugin({
        // assetNameRegExp: /\.optimize\.css$/g,
        cssProcessor: require("cssnano"),
        cssProcessorOptions: {
          discardComments: { removeAll: true }
        },
        canPrint: true
      })
    ]
  }
};

module.exports = config;
