const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  '@theme': path.resolve(__dirname, 'theme'),
  '@components': path.resolve(__dirname, 'components'),
  '@screens': path.resolve(__dirname, 'screens'),
  '@navigation': path.resolve(__dirname, 'navigation'),
  '@context': path.resolve(__dirname, 'context'),
  '@store': path.resolve(__dirname, 'store'),
  '@hooks': path.resolve(__dirname, 'hooks'),
  '@utils': path.resolve(__dirname, 'utils'),
  '@services': path.resolve(__dirname, 'services'),
  '@api': path.resolve(__dirname, 'api'),
  '@constants': path.resolve(__dirname, 'constants'),
  '@animations': path.resolve(__dirname, 'animations'),
};

module.exports = config;
