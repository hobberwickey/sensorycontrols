const path = require("path");
const fs = require("fs");
const url = require("url");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const RemoveEmptyScriptsPlugin = require("webpack-remove-empty-scripts");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    main: "/src/main.js",
    screen: "/src/screen.js",
    bridge: "/src/bridge.js",
    styles: ["/src/scss/main.scss"],
  },
  mode: "development",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "js/[name].js",
  },
  cache: false,
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: "babel-loader",
      },
      {
        test: /\.html/,
        use: [
          {
            loader: "building-blocks/loader.js",
            options: {},
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              sassOptions: {
                style: "expanded",
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|gif|woff|woff2|eot|ttf|svg)$/,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 1000,
              name: "public/img/[name].[ext]",
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new RemoveEmptyScriptsPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    }),
  ],
  devServer: {
    watchFiles: "./src/**/*",
  },
};
