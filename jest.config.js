module.exports = {
  preset: "jest-expo",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@store/(.*)$": "<rootDir>/store/$1",
  },
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/"],
};
