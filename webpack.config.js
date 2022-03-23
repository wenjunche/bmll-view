const path = require("path");
  
const HtmlwebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.tsx'
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    module: {
        rules: [
            {
                test: /\.(ts|tsx)?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.css$/i,
                use: [ "style-loader", "css-loader"],
            }            
        ]
    },
    resolve: {
        extensions: [ '.ts', '.js', '.tsx' ],
    },
    plugins: [
        new HtmlwebpackPlugin({
            title: 'OpenFin BMLL Example',
            template: 'res/index.html',
            filename: 'index.html',
            chunks: ['index']
        })
    ],
    devServer: {
        static : {
            directory : path.join(__dirname, 'dist')
        },
        port: process.env.DEV_PORT,
        hot: true,
        open: ['./index.html']
    }
};