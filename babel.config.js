module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      ['module:react-native-dotenv'],
      ['transform-remove-console', { exclude: ['error', 'warn'] }]
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
