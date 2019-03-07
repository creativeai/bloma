const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = env => {
  const devMode = env.development;

  // style loaders
  let styleLoaders = [
    {
      loader: 'css-loader',
      options: {
        url: false
      }
    },
    {
      loader: 'sass-loader',
      options: {
        includePaths: ['./src/scss']
      }
    }
  ];
  if (devMode) {
    styleLoaders = ['css-hot-loader', 'style-loader', ...styleLoaders];
  } else {
    styleLoaders = [MiniCssExtractPlugin.loader, ...styleLoaders];
  }

  // plugins
  let plugins = [
    new MiniCssExtractPlugin({
      filename: `[name].css`
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html'
    }),
    new CopyWebpackPlugin([
      { from: './src/assets', to: 'assets' },
      { from: './src/models', to: 'models' }
    ])
  ];

  if (!devMode) {
    plugins.push(new CleanWebpackPlugin(['dist']));
  }

  const config = {
    entry: './src/app/app.tsx',
    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      globalObject: 'this'
    },
    devtool: devMode ? 'inline-source-map' : undefined,
    devServer: {
      contentBase: './dist',
      historyApiFallback: true
    },
    module: {
      rules: [
        {
          test: /\.(js|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'ts-loader',
            options: {
              onlyCompileBundledFiles: true
            }
          }
        },
        {
          test: /\.scss$/,
          use: styleLoaders
        },
        {
          test: /\.(jpg|otf|ttf|woff|woff2|png|svg)$/,
          use: {
            loader: 'file-loader'
          }
        }
      ]
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js']
    },
    plugins,
    node: {
      fs: 'empty'
    }
  };

  return config;
};
