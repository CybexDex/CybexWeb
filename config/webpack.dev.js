const {
  loaders,
  resolve,
  plugins,
  BASE_URL,
  outputPath,
  defines
} = require("./webpack.config");
const path = require("path");
console.log("Webpack Config for Dev");
const webpack = require("webpack");
const cssLoaders = [
  {
    test: /\.css$/,
    use: [
      {
        loader: "style-loader"
      },
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
      {
        loader: "style-loader"
      },
      {
        loader: "css-loader"
      },
      {
        loader: "postcss-loader",
        options: {
          plugins: [require("autoprefixer")]
        }
      },
      {
        loader: "sass-loader",
        options: {
          outputStyle: "expanded"
        }
      }
    ]
  }
];

const def = {
  ...{
    "process.env": {
      NODE_ENV: JSON.stringify("development")
    },
    __DEV__: true
  },
  ...defines
};
console.log("DEF: ", def);
const devPlugins = [
  new webpack.DefinePlugin(def),
  new webpack.HotModuleReplacementPlugin()
].concat(plugins);

const config = {
  entry: {
    vendor: ["react", "react-dom", "highcharts/highstock", "lodash"],
    styles: path.resolve(BASE_URL, "app/assets/style-loader.js"),
    assets: path.resolve(BASE_URL, "app/assets/loader-dev"),
    app: [
      "react-hot-loader/patch",
      "webpack-hot-middleware/client",
      path.resolve(BASE_URL, "app/Main-dev.js")
    ]
  },
  context: path.resolve(BASE_URL, "app"),
  output: {
    publicPath: "/",
    path: outputPath,
    filename: "[name]-[hash:7].js",
    pathinfo: true,
    sourceMapFilename: "[name].js.map"
  },
  mode: "development",
  devtool: "cheap-module-eval-source-map",
  module: {
    rules: loaders.concat(cssLoaders)
  },
  resolve,
  plugins: devPlugins,
  node: {
    fs: "empty"
  },
  optimization: {}
};

module.exports = config;
