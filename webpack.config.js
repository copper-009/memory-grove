const { resolve } = require('path');
const glob = require('glob');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ESBuildMinifyPlugin } = require('esbuild-loader');
const { ProvidePlugin, BannerPlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

// RemNote loads each widget twice: once on the main thread (native) and once inside the
// sandbox iframe. Every widget entry therefore needs a `-sandbox` twin.
const SANDBOX_SUFFIX = '-sandbox';

const config = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'eval-cheap-module-source-map',
  entry: glob.sync('./src/widgets/**/*.tsx').reduce((obj, el) => {
    const rel = path.relative('src/widgets', el).replace(/\.[tj]sx?$/, '').replace(/\\/g, '/');
    obj[rel] = el;
    obj[`${rel}${SANDBOX_SUFFIX}`] = el;
    return obj;
  }, {}),
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    publicPath: '',
  },
  resolve: { extensions: ['.js', '.jsx', '.ts', '.tsx'] },
  module: {
    rules: [
      {
        test: /\.(ts|tsx|jsx|js)?$/,
        loader: 'esbuild-loader',
        options: { loader: 'tsx', target: 'es2020', minify: false },
      },
      {
        test: /\.css$/i,
        use: [
          isProd ? MiniCssExtractPlugin.loader : 'style-loader',
          { loader: 'css-loader', options: { url: false } },
          'postcss-loader',
        ],
      },
    ],
  },
  plugins: [
    isProd ? new MiniCssExtractPlugin({ filename: '[name].css' }) : undefined,
    new HtmlWebpackPlugin({
      templateContent: `
      <body></body>
      <script type="text/javascript">
      const urlSearchParams = new URLSearchParams(window.location.search);
      const queryParams = Object.fromEntries(urlSearchParams.entries());
      const widgetName = queryParams["widgetName"];
      if (widgetName == undefined) {document.body.innerHTML+="Widget ID not specified."}

      const s = document.createElement('script');
      s.type = "module";
      s.src = widgetName+"${SANDBOX_SUFFIX}.js";
      document.body.appendChild(s);
      </script>
    `,
      filename: 'index.html',
      inject: false,
    }),
    new ProvidePlugin({ React: 'react', reactDOM: 'react-dom' }),
    new BannerPlugin({
      banner: (file) => (!file.chunk.name.includes(SANDBOX_SUFFIX) ? 'const IMPORT_META=import.meta;' : ''),
      raw: true,
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public', to: '' },
        { from: 'README.md', to: '' },
        { from: 'THIRD_PARTY_NOTICES.md', to: '' },
        { from: 'LICENSE', to: 'LICENSE' },
        // The vendored Memory Forest engine (src/vendor/memory-forest/web/) is loaded via
        // plain <script> tags at runtime (src/forest/mfLoader.ts), not imported as modules —
        // it's a set of classic IIFE scripts that build up window.AnkiForest, unmodified
        // from the original. Served as static files under /vendor/ in the built plugin, the
        // same URL scheme the render harness (tools/harness/mf.html) already proved works.
        { from: 'src/vendor/memory-forest/web', to: 'vendor' },
        // Memory Grove's own envs (src/envs/) that plug into the vendored engine's AF.env
        // registry (DECISIONS.md's Phase 3 entries) — same loading mechanism, a distinct
        // URL namespace so they're never mistaken for vendored files.
        { from: 'src/envs', to: 'envs' },
      ],
    }),
  ].filter(Boolean),
  // The scene is one canvas; bundles stay small. Keep webpack quiet about size hints
  // rather than letting them show up as build warnings.
  performance: { hints: false },
  stats: 'errors-warnings',
};

if (isProd) {
  config.optimization = { minimize: true, minimizer: [new ESBuildMinifyPlugin({ target: 'es2020' })] };
} else {
  config.devServer = {
    port: 8080,
    hot: true,
    compress: true,
    watchFiles: ['src/*'],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'baggage, sentry-trace',
    },
  };
}

module.exports = config;
