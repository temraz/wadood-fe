module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-template-literals',
      '@babel/plugin-transform-export-namespace-from'
    ],
  };
}; 