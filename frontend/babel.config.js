module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@theme': './theme',
            '@components': './components',
            '@screens': './screens',
            '@navigation': './navigation',
            '@context': './context',
            '@store': './store',
            '@hooks': './hooks',
            '@utils': './utils',
            '@services': './services',
            '@api': './api',
            '@constants': './constants',
            '@animations': './animations',
          },
          extensions: ['.ios.js', '.android.js', '.js', '.jsx', '.ts', '.tsx', '.json'],
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
