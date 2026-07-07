module.exports = {
  preset: 'jest-expo',
  setupFilesAfterFramework: [],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|lottie-react-native)',
  ],
  moduleNameMapper: {
    '^@theme(.*)$': '<rootDir>/theme$1',
    '^@components(.*)$': '<rootDir>/components$1',
    '^@screens(.*)$': '<rootDir>/screens$1',
    '^@navigation(.*)$': '<rootDir>/navigation$1',
    '^@context(.*)$': '<rootDir>/context$1',
    '^@store(.*)$': '<rootDir>/store$1',
    '^@hooks(.*)$': '<rootDir>/hooks$1',
    '^@utils(.*)$': '<rootDir>/utils$1',
    '^@services(.*)$': '<rootDir>/services$1',
    '^@api(.*)$': '<rootDir>/api$1',
    '^@constants(.*)$': '<rootDir>/constants$1',
    '^@animations(.*)$': '<rootDir>/animations$1',
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'screens/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
};
