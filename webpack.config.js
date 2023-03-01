const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require('html-webpack-plugin');
//const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
//new BundleAnalyzerPlugin()
module.exports = {
  entry: "./src/index.js",
  mode: "production",
  target: 'web',
  resolve: {
    extensions: ['.ts', '.js','.css','.png'],
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve("dist"),
    publicPath: "/dist",
  },
  performance: {
    hints: process.env.NODE_ENV === 'production' ? "warning" : false
  },
  module: {
    rules:[
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: "babel-loader"
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        use: [
          {
            loader: 'file-loader',
          },
        ],
      },
    ], 
  },
  devServer: {
    historyApiFallback: true,
    hot: false,
  },
  plugins:[
    new webpack.DefinePlugin({
        process: {env: {}}
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: './index.html'
    }),
  ]
}

