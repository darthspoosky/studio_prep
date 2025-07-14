# Step-by-Step Repository Migration Guide

This guide provides detailed steps to clean up and reorganize the PrepTalk repository. Follow these steps in order to ensure a smooth migration.

## Prerequisites

- [ ] Ensure all work is committed
- [ ] Create a full backup of the repository
- [ ] Notify team members about the migration
- [ ] Have at least 2 hours of uninterrupted time

## Step 1: Initial Setup (15 minutes)

### 1.1 Create a new branch for the migration
```bash
git checkout -b feature/repository-cleanup
git push -u origin feature/repository-cleanup
```

### 1.2 Make the cleanup script executable
```bash
chmod +x scripts/cleanup-repo.sh
```

### 1.3 Run initial cleanup script
```bash
./scripts/cleanup-repo.sh
```

This will:
- Remove duplicate files
- Create new directory structure
- Move documentation files
- Update .gitignore

### 1.4 Verify and commit Phase 1
```bash
git add -A
git commit -m "chore: Phase 1 - Remove duplicates and create directory structure"
```

## Step 2: Consolidate Page Variants (30 minutes)

### 2.1 Review page variants
Check the MIGRATION_STATUS.md file for the list of page variants.

### 2.2 For each variant set, consolidate manually:

**Example: Dashboard pages**
```bash
# Compare the files
diff src/app/dashboard/page.tsx src/app/dashboard/page-improved.tsx
diff src/app/dashboard/page.tsx src/app/dashboard/page_old.tsx

# Keep the best version (usually the most recent)
mv src/app/dashboard/page-improved.tsx src/app/dashboard/page.tsx
rm src/app/dashboard/page_old.tsx
```

**Example: Daily Quiz pages**
```bash
# If enhanced-production.tsx has all features:
mv src/app/daily-quiz/enhanced-production.tsx src/app/daily-quiz/page.tsx
rm src/app/daily-quiz/page-original.tsx
```

### 2.3 Update imports if necessary
```bash
# Search for imports of old files
grep -r "page-original" src/
grep -r "enhanced-production" src/
# Update any found imports
```

### 2.4 Commit consolidated pages
```bash
git add -A
git commit -m "chore: Consolidate page variants"
```

## Step 3: Reorganize Tests (20 minutes)

### 3.1 Move unit tests
```bash
# Move component tests
find src/components -name "*.test.tsx" -exec mv {} tests/unit/components/ \;
find src/hooks -name "*.test.ts" -exec mv {} tests/unit/hooks/ \;
find src/services -name "*.test.ts" -exec mv {} tests/unit/services/ \;

# Move __tests__ directories
find src -type d -name "__tests__" -exec cp -r {} tests/unit/ \;
find src -type d -name "__tests__" -exec rm -rf {} \;
```

### 3.2 Move integration tests
```bash
mv src/__tests__/integration.test.ts tests/integration/
mv scripts/test-*.ts tests/integration/
```

### 3.3 Update test imports
```bash
# Update relative imports in test files
find tests -name "*.test.ts" -o -name "*.test.tsx" | xargs sed -i 's|"\.\./|"../../src/|g'
```

### 3.4 Commit test reorganization
```bash
git add -A
git commit -m "chore: Reorganize test structure"
```

## Step 4: Consolidate Configuration (15 minutes)

### 4.1 Move Jest configurations
```bash
mv jest.config.js config/jest/
mv jest.config.framework.js config/jest/
mv tsconfig.jest.json config/typescript/
```

### 4.2 Update Jest config paths
Edit `config/jest/jest.config.js`:
```javascript
module.exports = {
  rootDir: '../../',
  testMatch: ['<rootDir>/tests/**/*.test.{ts,tsx}'],
  // Update other paths as needed
};
```

### 4.3 Update package.json test scripts
```json
{
  "scripts": {
    "test": "jest --config config/jest/jest.config.js",
    "test:watch": "jest --config config/jest/jest.config.js --watch",
    "test:coverage": "jest --config config/jest/jest.config.js --coverage"
  }
}
```

### 4.4 Commit configuration changes
```bash
git add -A
git commit -m "chore: Consolidate configuration files"
```

## Step 5: Clean Up Dependencies (20 minutes)

### 5.1 Remove src/package.json dependencies
Since we're removing src/package.json, ensure all needed dependencies are in root package.json:

```bash
# Compare dependencies
diff package.json src/package.json

# Add any missing dependencies to root package.json
npm install <any-missing-packages>
```

### 5.2 Clean up node_modules
```bash
rm -rf node_modules src/node_modules functions/node_modules
npm install
cd functions && npm install && cd ..
```

### 5.3 Update import paths if needed
```bash
# Fix any broken imports after removing src/package.json
npm run typecheck
```

### 5.4 Commit dependency updates
```bash
git add -A
git commit -m "chore: Consolidate dependencies"
```

## Step 6: Update Build and CI/CD (20 minutes)

### 6.1 Update GitHub Actions workflows
Check `.github/workflows/` files and update any paths that have changed.

### 6.2 Update build scripts
Ensure all scripts in package.json work with new structure:
```bash
npm run build
npm run lint
npm run typecheck
npm test
```

### 6.3 Fix any issues found
Address any build or lint errors that arise from the reorganization.

### 6.4 Commit CI/CD updates
```bash
git add -A
git commit -m "chore: Update CI/CD for new structure"
```

## Step 7: Update Documentation (15 minutes)

### 7.1 Update README.md
Add a section about the new project structure:

```markdown
## Project Structure

```
studio_prep/
├── docs/           # All documentation
├── functions/      # Firebase Cloud Functions
├── src/           # Application source code
├── tests/         # Test files
├── scripts/       # Utility scripts
└── config/        # Configuration files
```
```

### 7.2 Update CLAUDE.md
Update any paths mentioned in CLAUDE.md to reflect new structure.

### 7.3 Create CONTRIBUTING.md
```bash
cat > .github/CONTRIBUTING.md << 'EOF'
# Contributing to PrepTalk

## Project Structure
[Explain new structure]

## Development Setup
[Update setup instructions]

## Testing
Tests are located in the `tests/` directory...

## Code Style
[Add style guidelines]
EOF
```

### 7.4 Commit documentation updates
```bash
git add -A
git commit -m "docs: Update documentation for new structure"
```

## Step 8: Final Testing and Verification (20 minutes)

### 8.1 Run all checks
```bash
# Clean install
rm -rf node_modules .next
npm install

# Run all checks
npm run typecheck
npm run lint
npm test
npm run build
```

### 8.2 Test critical user flows
1. Start development server: `npm run dev`
2. Test login/signup flow
3. Test quiz generation
4. Test writing evaluation
5. Test mock interview

### 8.3 Update MIGRATION_STATUS.md
Mark all completed tasks and note any remaining issues.

### 8.4 Final commit
```bash
git add -A
git commit -m "chore: Complete repository reorganization"
```

## Step 9: Deployment (15 minutes)

### 9.1 Create Pull Request
```bash
git push origin feature/repository-cleanup
```

Create a PR with:
- Summary of changes
- Link to this guide
- Testing checklist

### 9.2 Deploy to staging
After PR approval, deploy to staging environment first.

### 9.3 Monitor for issues
Watch logs and error tracking for any issues.

### 9.4 Deploy to production
Once staging is stable, deploy to production.

## Rollback Plan

If issues arise:

```bash
# Quick rollback
git checkout main
git pull origin main

# Or revert the merge commit
git revert -m 1 <merge-commit-hash>
```

## Post-Migration Checklist

- [ ] All tests passing
- [ ] Build successful
- [ ] No broken imports
- [ ] Documentation updated
- [ ] Team notified
- [ ] Staging deployed
- [ ] Production deployed
- [ ] Monitoring shows no errors

## Common Issues and Solutions

### Issue: Import errors after reorganization
**Solution**: Update tsconfig.json paths or use find/replace to update imports

### Issue: Tests failing due to path changes
**Solution**: Update jest.config.js moduleNameMapper

### Issue: CI/CD pipeline failures
**Solution**: Check workflow files for hardcoded paths

### Issue: Missing dependencies
**Solution**: Check old package.json files and add missing deps to root

## Success Metrics

- Reduced duplicate files from X to 0
- Consolidated package.json files from 4 to 2
- Organized documentation into logical structure
- Standardized test organization
- Improved build time
- Cleaner repository structure

---

Remember: Take your time, test thoroughly, and don't hesitate to ask for help if needed!