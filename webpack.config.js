var webpack = require('webpack');
var debug = process.env.NODE_ENV !== "production";

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require('brotli-webpack-plugin');

if (debug)
    console.log("running in debug mode");

function getEntrySources(sources) {
    if (debug) {
        sources.push('webpack-dev-server/client?http://localhost:8080');
        sources.push('webpack/hot/only-dev-server');
    }

    return sources;
}

function getPlugins() {
    var plugs = [
        new ExtractTextPlugin({
            filename: 'style.css',
            allChunks: true
        }),
        new webpack.optimize.ModuleConcatenationPlugin()
    ];
    if (!debug) {
        plugs.push(
            new UglifyJSPlugin({
                compress: {
                    warnings: false
                },
                mangle: false,
                comments: false
            }),
            new CompressionPlugin({
                asset: "[path].gz[query]",
                algorithm: "gzip",
                test: /\.(js|html|css|svg)$/,
                threshold: 10240,
                minRatio: 0.8
            }),
            new BrotliPlugin({
                asset: '[path].br[query]',
                test: /\.(js|css|html|svg)$/,
                threshold: 10240,
                minRatio: 0.8
            })
        );
    }
    return plugs;
}

module.exports = {
    devServer: {
        contentBase: "./web",
        compress: true,
        port: 8080
    },
    entry: {
        app: getEntrySources([
            './js/app.js'
        ])
    },
    output: {
        path: __dirname + '/web/app',
        filename: '[name].js'
    },
    module: {
        loaders: [
            {
                test: /\.jsx?$/,
                loaders: [
                    'babel-loader'
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(gif|eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
                loader: 'url-loader'
            },
            {
                test: /\.(scss|css)$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        {
                            loader: 'css-loader',
                            query: {
                                minimize: !debug,
                                sourceMap: debug
                            }
                        },
                        {
                            loader: 'sass-loader',
                            query: {
                                sourceMap: debug
                            }
                        }
                    ]
                })
            }
        ]
    },
    plugins: getPlugins(),
    resolve: {
        extensions: ['.js', '.jsx']
    }
};

if (debug) {
    module.exports.devtool = 'cheap-source-map';
}

