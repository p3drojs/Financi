import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'unit',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/test/unit/**/*.test.ts'],
      setupFiles: ['<rootDir>/test/env.setup.ts'],
    },
    {
      displayName: 'e2e',
      preset: 'ts-jest',
      testEnvironment: 'node',
      rootDir: '.',
      testMatch: ['<rootDir>/test/e2e/**/*.test.ts'],
      setupFiles: ['<rootDir>/test/env.setup.ts'],
      setupFilesAfterEnv: ['<rootDir>/test/e2e/setup.ts'],
    },
  ],
  collectCoverageFrom: ['src/**/*.ts', '!src/server.ts'],
  coverageDirectory: 'coverage',
};

export default config;
