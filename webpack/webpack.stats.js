/**
 * webpack.stats.js
 *
 * 该文件定义了生产环境的webpack配置，用于生成构建报告。
 *
 */
const path = require("path");
const { merge } = require("webpack-merge");
const { BundleAnalyzerPlugin } = require("webpack-bundle-analyzer");

const basePath = `${__dirname}/..`;
const common = require("./webpack.prod.js");

module.exports = merge(common, {
  plugins: [
    new BundleAnalyzerPlugin({
      analyzerMode: "static",
      openAnalyzer: false,
      reportFilename: path.resolve(basePath, "dist/report.html"),
    }),
  ],
  devServer: {
    hot: false,
  },
  optimization: {
    chunkIds: "named",
  },
});
