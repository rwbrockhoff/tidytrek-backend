export default {
  preset: "ts-jest",
  testMatch: ["<rootDir>/dist/server/routes/**/*.test.js"],
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
};
