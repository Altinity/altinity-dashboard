const path = require('path');
const { merge } = require("webpack-merge");
const common = require("./webpack.common.js");
const { stylePaths } = require("./stylePaths");
const HOST = process.env.HOST || "localhost";
const PORT = process.env.PORT || "9090";

module.exports = merge(common('development'), {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    host: HOST,
    port: PORT,
    compress: true,
    historyApiFallback: true,
    open: true,
    proxy: {
        '/api': 'http://localhost:8080',
        '/chi-examples': 'http://localhost:8080',
    },
  },
  module: {
    rules: [
      {
        test: /\.css$/,
//        include: [
//          ...stylePaths
//        ],
        use: ["style-loader", "css-loader"]
      }
    ]
  }
});
