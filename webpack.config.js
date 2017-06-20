var webpack = require('webpack');
var debug = process.env.NODE_ENV !== "production";

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const BrotliPlugin = require('brotli-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

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
        new webpack.optimize.ModuleConcatenationPlugin(),
        new ExtractTextPlugin({
            filename: 'style.css',
            allChunks: true
        }),
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano'),
            cssProcessorOptions: {
                discardComments: {
                    removeAll: true
                }
            },
            canPrint: true
        })

    ];
    if (!debug) {
        plugs.push(
            new CleanWebpackPlugin(['app', 'fonts'], {
                root: __dirname + '/web',
                verbose: true,
                dry: false,
                //exclude: ['shared.js'],
            }),
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
                test: /\.(js|html|css|svg|ttf|eot|woff2?)$/,
                threshold: 10240,
                minRatio: 0.8
            }),
            new BrotliPlugin({
                asset: '[path].br[query]',
                test: /\.(js|html|css|svg|ttf|eot|woff2?)$/,
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
        compress: false,
        port: 8080
    },
    entry: {
        app: getEntrySources([
            './js/app.js'
        ])
    },
    output: {
        path: __dirname + '/web/app',
        publicPath: '/app/',
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
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
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

