var ExtractTextPlugin = require('extract-text-webpack-plugin');
var webpack = require('webpack');
var debug = process.env.NODE_ENV !== "production";
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
            filename: './web/style.css',
            allChunks: true
        })
    ];
    if (!debug) {
        plugs.push(new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false
            }
        }));
    }
    return plugs;
}

module.exports = {
    entry: {
        app: getEntrySources([
            './js/app.js'
        ])
    },
    output: {
        publicPath: 'http://localhost:8080/',
        filename: './web/[name].js'
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
                test: /\.(scss|css)$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        'sass-loader'
                    ]
                })
            },
            {
                test: /\.(eot|svg|ttf|woff(2)?)(\?v=\d+\.\d+\.\d+)?/,
                loader: 'url-loader'
            }
        ]
    },
    plugins: getPlugins(),
    resolve: {
        extensions: ['.js', '.jsx']
    }
};

