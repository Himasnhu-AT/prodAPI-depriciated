/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: "node",
    testMatch: ["<rootDir>/src/**/*.test.(ts|tsx)"],
    transform: {
        "^.+.tsx?$": ["ts-jest", {}],
    },
};