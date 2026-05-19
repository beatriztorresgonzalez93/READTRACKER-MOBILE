module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@store/(.*)$": "<rootDir>/store/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/server/"],
  transformIgnorePatterns: [
    "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|@gluestack-ui|@gluestack-style|react-native-svg|@legendapp))",
    "/node_modules/react-native-reanimated/plugin/",
  ],
};
