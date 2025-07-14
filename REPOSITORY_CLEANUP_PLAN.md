# Repository Cleanup and Reorganization Plan

## Overview
This document outlines a comprehensive plan to clean up and reorganize the PrepTalk UPSC repository for better maintainability, clarity, and development efficiency.

## Phase 1: Immediate Cleanup (Quick Wins)

### 1.1 Remove Duplicate and Unnecessary Files
```bash
# Remove duplicate firestore rules (one with leading space)
rm " firestore.rules"

# Remove unnecessary package.json
rm src/package.json

# Remove test admin functionality duplicates
rm test_admin_functionality.js  # Keep .mjs version

# Remove oddly named file
rm "[The ABSOLUTE, FULL path to the file being modified]"

# Remove temporary test files
rm first_test.md
rm test.md
rm test-results.html
rm admin_test_results.json

# Remove old versions of files
rm gemini_old.md
rm src/app/globals.css  # Keep globals-improved.css and rename it
```

### 1.2 Update .gitignore
Add the following to .gitignore:
```
# Logs
*.log
dev.log
firebase-debug.log
firestore-debug.log
pglite-debug.log

# Build artifacts
.next/
.turbo/
*.tsbuildinfo

# Test outputs
test-results.html
*_test_results.json
coverage/

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store
```

### 1.3 Clean up page variants
For each directory with multiple page versions:
- Keep the most recent/production version
- Archive old versions in a `_archive` folder temporarily
- Remove after confirming nothing breaks

## Phase 2: Directory Reorganization

### 2.1 New Directory Structure
```
studio_prep/
├── .github/
│   ├── workflows/
│   └── CONTRIBUTING.md
├── docs/
│   ├── architecture/
│   │   ├── BACKEND_ARCHITECTURE.md
│   │   ├── MULTI_AGENT_FRAMEWORK.md
│   │   └── DATABASE_SCHEMA.md
│   ├── guides/
│   │   ├── SETUP_GUIDE.md
│   │   ├── DEPLOYMENT_GUIDE.md
│   │   └── TESTING_GUIDE.md
│   ├── api/
│   │   └── API_DOCUMENTATION.md
│   └── decisions/
│       └── ADR_*.md (Architecture Decision Records)
├── functions/
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── lib/
│   ├── contexts/
│   ├── types/
│   ├── styles/
│   └── ai/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   └── fixtures/
├── scripts/
│   ├── setup/
│   ├── deployment/
│   └── maintenance/
├── public/
├── config/
│   ├── jest/
│   ├── firebase/
│   └── typescript/
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
├── CLAUDE.md
└── CHANGELOG.md
```

### 2.2 Move Documentation
```bash
# Create new docs structure
mkdir -p docs/{architecture,guides,api,decisions}

# Move architecture docs
mv BACKEND_ARCHITECTURE.md docs/architecture/
mv MULTI_AGENT_FRAMEWORK_COMPLETE.md docs/architecture/MULTI_AGENT_FRAMEWORK.md
mv MULTI_AGENT_MIGRATION_GUIDE.md docs/architecture/
mv firestore-schema-updates.md docs/architecture/DATABASE_SCHEMA.md

# Move guides
mv DOCUMENTATION.md docs/guides/SETUP_GUIDE.md
mv DASHBOARD_PRODUCTION_ASSESSMENT.md docs/guides/
mv TESTING_GUIDE.md docs/guides/

# Move implementation summaries to decisions
mv *_IMPLEMENTATION*.md docs/decisions/
mv *_SUMMARY.md docs/decisions/

# Move planning docs to archive
mkdir -p docs/archive
mv backend_migration_plan.md docs/archive/
mv NEWSPAPER_ANALYSIS_MODERNIZATION_PLAN.md docs/archive/
```

### 2.3 Consolidate Test Structure
```bash
# Create unified test structure
mkdir -p tests/{unit,integration,e2e,fixtures}

# Move all __tests__ directories
find src -name "__tests__" -type d -exec mv {} tests/unit/ \;

# Move test files
find src -name "*.test.ts" -o -name "*.test.tsx" | xargs -I {} mv {} tests/unit/

# Move test scripts
mv scripts/test-*.ts tests/integration/
```

### 2.4 Consolidate Configuration
```bash
# Create config directory
mkdir -p config/{jest,firebase,typescript}

# Move Jest configs
mv jest.config.js config/jest/jest.config.js
mv jest.config.framework.js config/jest/jest.config.framework.js
mv tsconfig.jest.json config/typescript/

# Update root configs to reference new locations
```

## Phase 3: Code Consolidation

### 3.1 Merge Page Variants
For each component with multiple versions:
1. Compare features in each version
2. Create a single consolidated version with all features
3. Use feature flags if needed for gradual rollout
4. Remove old versions

### 3.2 Consolidate Admin Upload Features
1. Analyze `/admin/upload/` and `/admin/question-upload/`
2. Create a unified upload component
3. Remove duplicate functionality

### 3.3 Standardize Component Structure
```
components/
├── common/
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
│   └── Card/
├── features/
│   ├── Quiz/
│   ├── Interview/
│   └── Writing/
└── layout/
    ├── Header/
    └── Sidebar/
```

## Phase 4: Dependency Management

### 4.1 Consolidate Dependencies
1. Analyze all package.json files
2. Move shared dependencies to root
3. Keep function-specific deps in functions/package.json
4. Remove duplicate dependencies

### 4.2 Update Import Paths
After reorganization, update all import paths:
1. Use TypeScript path aliases consistently
2. Update `@/` to point to `src/`
3. Fix any broken imports

## Phase 5: Configuration Updates

### 5.1 Update Build Scripts
Update package.json scripts to reflect new structure:
```json
{
  "scripts": {
    "test": "jest --config config/jest/jest.config.js",
    "test:unit": "jest --config config/jest/jest.config.js tests/unit",
    "test:integration": "jest --config config/jest/jest.config.js tests/integration",
    "lint": "eslint src/**/*.{ts,tsx}",
    "clean": "rm -rf .next node_modules functions/node_modules"
  }
}
```

### 5.2 Update CI/CD
1. Update GitHub Actions workflows for new paths
2. Update build commands
3. Update test commands

## Phase 6: Final Steps

### 6.1 Update Documentation
1. Update README.md with new structure
2. Create CONTRIBUTING.md with coding standards
3. Update CLAUDE.md with new paths

### 6.2 Testing
1. Run full test suite
2. Test all build processes
3. Deploy to staging environment
4. Verify all features work

### 6.3 Create Migration Script
Create an automated script to perform the migration:
```bash
#!/bin/bash
# migration.sh
# This script automates the repository cleanup
```

## Implementation Timeline

### Week 1: Phase 1-2 (Cleanup & Basic Reorg)
- Day 1-2: Remove duplicates, update .gitignore
- Day 3-4: Create new directory structure
- Day 5: Move documentation and tests

### Week 2: Phase 3-4 (Code Consolidation)
- Day 1-2: Merge page variants
- Day 3-4: Consolidate components
- Day 5: Update dependencies

### Week 3: Phase 5-6 (Configuration & Testing)
- Day 1-2: Update configurations
- Day 3-4: Full testing
- Day 5: Documentation updates

## Risks and Mitigation

1. **Risk**: Breaking imports during reorganization
   - **Mitigation**: Use automated tools to update imports, comprehensive testing

2. **Risk**: CI/CD pipeline failures
   - **Mitigation**: Update workflows incrementally, test in separate branch

3. **Risk**: Lost functionality from consolidation
   - **Mitigation**: Careful comparison of features, maintain feature parity

## Success Criteria

- [ ] No duplicate files in repository
- [ ] Clear, logical directory structure
- [ ] All tests passing
- [ ] CI/CD pipeline working
- [ ] Documentation updated
- [ ] No broken imports
- [ ] Improved developer experience

## Notes

- Create a backup branch before starting
- Document all decisions made during consolidation
- Consider using tools like `madge` to visualize dependencies
- Run regular builds during migration to catch issues early