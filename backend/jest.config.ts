import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],
  clearMocks: true,
  testTimeout: 30000,
  setupFiles: ['<rootDir>/tests/setup.ts'],
  forceExit: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
};

export default config;
