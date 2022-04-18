const path = require("path");
var HTMLWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: "production",
    entry: "./src/index.ts",
    output: {
        filename: "[name].[contenthash].js",
        path: path.resolve(__dirname, "public/build"),
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    plugins: [
        new HTMLWebpackPlugin({
            template: path.join(__dirname, './template.html'),
            filename: "../index.html",
            inject: "head",
            scriptLoading: "module"
        })
    ],
    optimization: {
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
};
