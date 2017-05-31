// karma.conf.js
var webpack = require('webpack');

module.exports = function (config) {
    config.set({
        browsers: ['Chrome'],
        singleRun: true,
        frameworks: ['mocha'],
        files: [
            'tests.webpack.js'
        ],
        preprocessors: {
            'tests.webpack.js': ['webpack']
        },
        reporters: ['mocha', 'dots'],
        webpack: {
            module: {
                loaders: [
                    {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
                    {test: /\.((s)?css|eot|svg|ttf|woff(2)?)$/, loader: 'ignore-loader'}
                ]
            },
            resolve: {
                extensions: ['.js', '.jsx']
            },
            plugins: [
                new webpack.DefinePlugin({
                    ENV_TEST: JSON.stringify(true)
                })],
            watch: true
        },
        client: {
            captureConsole: false
        },
        webpackServer: {
            noInfo: true
        }
    });
};