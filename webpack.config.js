const path = require("path");
const webpack = require('webpack');

const HtmlwebpackPlugin = require('html-webpack-plugin');

const isDevServer = process.env.WEBPACK_SERVE;   // if in dev-server mode

let definePlugin;
if (!isDevServer) {
    definePlugin = new webpack.DefinePlugin({
        APP_ROOT_URL: JSON.stringify('https://testing-assets.openfin.co/bmll')
    });
} else {
    definePlugin = new webpack.DefinePlugin({
        APP_ROOT_URL: JSON.stringify('http://localhost:8081')
    });
}

module.exports = {
    mode: 'development',
    entry: {
        index: './src/index.tsx',
        provider: './src/provider.ts',
        isin: './src/components/Isin.tsx',
        plotview: './src/components/PlotView.tsx',
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
            chunks: ['plotview']
        }),
        new HtmlwebpackPlugin({
            title: 'OpenFin BMLL ISIN selection',
            template: 'res/select.html',
            filename: 'select.html',
            chunks: ['isin']
        }),
        definePlugin
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