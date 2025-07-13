/**
 * Jest configuration for Multi-Agent Framework testing
 */

module.exports = {
  displayName: 'Multi-Agent Framework',
  testEnvironment: 'node',
  preset: 'ts-jest',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/ai/multi-agent-framework/**/*.test.ts',
    '<rootDir>/src/ai/multi-agent-framework/**/*.spec.ts'
  ],
  
  // Module resolution
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/ai/multi-agent-framework/tests/setup.ts'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/framework',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/ai/multi-agent-framework/**/*.ts',
    '!src/ai/multi-agent-framework/**/*.d.ts',
    '!src/ai/multi-agent-framework/**/*.test.ts',
    '!src/ai/multi-agent-framework/**/*.spec.ts',
    '!src/ai/multi-agent-framework/examples/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Test timeout
  testTimeout: 30000,
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        compilerOptions: {
          module: 'commonjs',
          target: 'es2020',
          lib: ['es2020'],
          allowJs: true,
          skipLibCheck: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          resolveJsonModule: true,
          isolatedModules: true
        }
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
  
  // Global setup
  globalSetup: '<rootDir>/src/ai/multi-agent-framework/tests/global-setup.ts',
  globalTeardown: '<rootDir>/src/ai/multi-agent-framework/tests/global-teardown.ts'
};