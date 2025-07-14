#!/bin/bash

# Repository Cleanup Script for PrepTalk UPSC
# This script automates the initial cleanup phase of the repository reorganization

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if we're in the right directory
if [[ ! -f "package.json" ]] || [[ ! -d "src" ]]; then
    print_error "This script must be run from the studio_prep root directory"
    exit 1
fi

print_status "Starting repository cleanup..."

# Create backup branch
print_status "Creating backup branch..."
git checkout -b backup/pre-cleanup-$(date +%Y%m%d-%H%M%S) || print_warning "Could not create backup branch"

# Phase 1: Remove duplicate and unnecessary files
print_status "Phase 1: Removing duplicate and unnecessary files..."

# Remove files safely (check if they exist first)
files_to_remove=(
    " firestore.rules"
    "src/package.json"
    "test_admin_functionality.js"
    "[The ABSOLUTE, FULL path to the file being modified]"
    "first_test.md"
    "test.md"
    "test-results.html"
    "admin_test_results.json"
    "gemini_old.md"
)

for file in "${files_to_remove[@]}"; do
    if [[ -f "$file" ]]; then
        rm "$file"
        print_status "Removed: $file"
    else
        print_warning "File not found: $file"
    fi
done

# Phase 2: Create new directory structure
print_status "Phase 2: Creating new directory structure..."

directories=(
    "docs/architecture"
    "docs/guides"
    "docs/api"
    "docs/decisions"
    "docs/archive"
    "tests/unit"
    "tests/integration"
    "tests/e2e"
    "tests/fixtures"
    "scripts/setup"
    "scripts/deployment"
    "scripts/maintenance"
    "config/jest"
    "config/firebase"
    "config/typescript"
)

for dir in "${directories[@]}"; do
    mkdir -p "$dir"
    print_status "Created directory: $dir"
done

# Phase 3: Move documentation files
print_status "Phase 3: Moving documentation files..."

# Architecture docs
docs_to_move=(
    "BACKEND_ARCHITECTURE.md:docs/architecture/"
    "MULTI_AGENT_FRAMEWORK_COMPLETE.md:docs/architecture/MULTI_AGENT_FRAMEWORK.md"
    "MULTI_AGENT_MIGRATION_GUIDE.md:docs/architecture/"
    "firestore-schema-updates.md:docs/architecture/DATABASE_SCHEMA.md"
    "question-management-schema.md:docs/architecture/"
)

for move_spec in "${docs_to_move[@]}"; do
    IFS=':' read -r source dest <<< "$move_spec"
    if [[ -f "$source" ]]; then
        if [[ "$dest" == *.md ]]; then
            mv "$source" "$dest"
        else
            mv "$source" "$dest"
        fi
        print_status "Moved: $source → $dest"
    else
        print_warning "Source file not found: $source"
    fi
done

# Move implementation summaries
find . -maxdepth 1 -name "*_IMPLEMENTATION*.md" -o -name "*_SUMMARY.md" -o -name "*_COMPLETE*.md" | while read -r file; do
    if [[ -f "$file" ]]; then
        mv "$file" "docs/decisions/"
        print_status "Moved to decisions: $file"
    fi
done

# Move planning docs to archive
planning_docs=(
    "backend_migration_plan.md"
    "NEWSPAPER_ANALYSIS_MODERNIZATION_PLAN.md"
    "backlog.md"
    "tasklist.md"
    "issues.md"
    "mistakes.md"
)

for doc in "${planning_docs[@]}"; do
    if [[ -f "$doc" ]]; then
        mv "$doc" "docs/archive/"
        print_status "Archived: $doc"
    fi
done

# Phase 4: Update .gitignore
print_status "Phase 4: Updating .gitignore..."

cat >> .gitignore << 'EOF'

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

# Temporary files
*.tmp
*.temp
EOF

print_status "Updated .gitignore"

# Phase 5: Clean up page variants
print_status "Phase 5: Identifying page variants to consolidate..."

# Find all page variants
find src/app -name "page-*.tsx" -o -name "page_*.tsx" -o -name "*-production.tsx" | while read -r file; do
    print_warning "Found page variant to review: $file"
done

# Phase 6: Create migration status file
print_status "Creating migration status file..."

cat > MIGRATION_STATUS.md << 'EOF'
# Migration Status

## Completed
- [x] Removed duplicate files
- [x] Created new directory structure
- [x] Moved documentation to organized folders
- [x] Updated .gitignore

## TODO
- [ ] Consolidate page variants (manual review needed)
- [ ] Move test files to new structure
- [ ] Update import paths
- [ ] Consolidate Jest configurations
- [ ] Update CI/CD workflows
- [ ] Test full application

## Files Requiring Manual Review
EOF

# Add files that need manual review
echo "" >> MIGRATION_STATUS.md
echo "### Page Variants to Consolidate:" >> MIGRATION_STATUS.md
find src/app -name "page-*.tsx" -o -name "page_*.tsx" -o -name "*-production.tsx" | while read -r file; do
    echo "- $file" >> MIGRATION_STATUS.md
done

print_status "Repository cleanup Phase 1 complete!"
print_warning "Please review MIGRATION_STATUS.md for next steps"
print_warning "Remember to commit changes and test the application"

# Summary
echo ""
echo "===== CLEANUP SUMMARY ====="
echo "Files removed: ${#files_to_remove[@]}"
echo "Directories created: ${#directories[@]}"
echo "Documentation reorganized"
echo "Next step: Run 'npm run lint' and 'npm test' to verify"
echo "=========================="