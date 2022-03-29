const path = require("path");
  
const HtmlwebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.tsx',
        provider: './src/provider.ts',
        view: './src/view.tsx',
    },
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name]-bundle.js'
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
        }),
        new HtmlwebpackPlugin({
            title: 'OpenFin BMLL Provider',
            template: 'res/provider.html',
            filename: 'provider.html',
            chunks: ['provider']
        }),
        new HtmlwebpackPlugin({
            title: 'OpenFin BMLL View',
            template: 'res/plotview.html',
            filename: 'plotview.html',
            chunks: ['view']
        })
    ],
    devServer: {
        static : {
            directory : path.join(__dirname, 'res')
        },
        port: 8081,
        hot: true,
        // open: ['./index.html']
    }
};