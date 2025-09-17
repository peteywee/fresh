#!/bin/bash

# Pre-commit hook for Fresh project
# Ensures code quality, documentation, and testing standards before commits

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Fresh Pre-commit Validation${NC}"
echo "==============================="
echo ""

ERRORS=0

# Check if this is the initial commit
if git rev-parse --verify HEAD >/dev/null 2>&1; then
    against=HEAD
else
    # Initial commit: diff against an empty tree object
    against=$(git hash-object -t tree /dev/null)
fi

# Get list of changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$CHANGED_FILES" ]; then
    echo -e "${YELLOW}⚠️  No staged changes found${NC}"
    exit 0
fi

echo -e "${BLUE}📁 Changed files:${NC}"
echo "$CHANGED_FILES" | sed 's/^/  - /'
echo ""

# 1. Check TypeScript compilation
echo -e "${BLUE}🔧 Checking TypeScript compilation...${NC}"
if command -v pnpm &> /dev/null; then
    if pnpm typecheck &> /dev/null; then
        echo -e "${GREEN}✅ TypeScript compilation passed${NC}"
    else
        echo -e "${RED}❌ TypeScript compilation failed${NC}"
        echo "Run 'pnpm typecheck' to see detailed errors"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  pnpm not found, skipping TypeScript check${NC}"
fi

# 2. Check linting
echo -e "${BLUE}🧹 Checking code linting...${NC}"
if command -v pnpm &> /dev/null; then
    if pnpm lint &> /dev/null; then
        echo -e "${GREEN}✅ Linting passed${NC}"
    else
        echo -e "${RED}❌ Linting failed${NC}"
        echo "Run 'pnpm lint' to see detailed errors"
        echo "Run 'pnpm lint:fix' to auto-fix issues"
        ((ERRORS++))
    fi
else
    echo -e "${YELLOW}⚠️  pnpm not found, skipping lint check${NC}"
fi

# 3. Check for API documentation
echo -e "${BLUE}📚 Checking API documentation...${NC}"
API_FILES=$(echo "$CHANGED_FILES" | grep "apps/web/app/api/.*route\.ts$" || true)
if [ -n "$API_FILES" ]; then
    MISSING_API_DOCS=0
    echo "$API_FILES" | while read -r file; do
        endpoint=$(echo "$file" | sed 's|apps/web/app/api||' | sed 's|/route.ts||')
        doc_file="docs/api${endpoint}.md"
        
        if [ ! -f "$doc_file" ]; then
            echo -e "${YELLOW}⚠️  Missing API documentation: $doc_file${NC}"
            echo "   Create docs with: ./scripts/docs-workflow.sh api-docs"
            ((MISSING_API_DOCS++))
        fi
    done
    
    if [ $MISSING_API_DOCS -eq 0 ]; then
        echo -e "${GREEN}✅ API documentation check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  $MISSING_API_DOCS API endpoints need documentation${NC}"
        # Don't fail the commit for missing API docs, just warn
    fi
else
    echo -e "${GREEN}✅ No API changes detected${NC}"
fi

# 4. Check for component documentation
echo -e "${BLUE}🧩 Checking component documentation...${NC}"
COMPONENT_FILES=$(echo "$CHANGED_FILES" | grep "apps/web/components/.*\.(ts|tsx)$" || true)
if [ -n "$COMPONENT_FILES" ]; then
    MISSING_COMPONENT_DOCS=0
    echo "$COMPONENT_FILES" | while read -r file; do
        component=$(basename "$file" .tsx)
        component=$(basename "$component" .ts)
        doc_file="docs/components/${component}.md"
        
        if [ ! -f "$doc_file" ]; then
            echo -e "${YELLOW}⚠️  Consider documenting component: $component${NC}"
            ((MISSING_COMPONENT_DOCS++))
        fi
    done
    
    echo -e "${GREEN}✅ Component documentation check completed${NC}"
else
    echo -e "${GREEN}✅ No component changes detected${NC}"
fi

# 5. Check for security sensitive files
echo -e "${BLUE}🔒 Checking for security sensitive changes...${NC}"
SECURITY_FILES=$(echo "$CHANGED_FILES" | grep -E "(auth|session|admin|security|firebase\.admin|\.env)" || true)
if [ -n "$SECURITY_FILES" ]; then
    echo -e "${YELLOW}⚠️  Security sensitive files changed:${NC}"
    echo "$SECURITY_FILES" | sed 's/^/    - /'
    echo -e "${YELLOW}⚠️  Ensure security review is completed${NC}"
    
    # Check if there's a security review note in the commit message
    COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
    if [ -f "$COMMIT_MSG_FILE" ]; then
        if ! grep -qi "security\|auth\|review" "$COMMIT_MSG_FILE"; then
            echo -e "${YELLOW}⚠️  Consider adding security review note to commit message${NC}"
        fi
    fi
else
    echo -e "${GREEN}✅ No security sensitive changes detected${NC}"
fi

# 6. Check for secrets or sensitive data
echo -e "${BLUE}🔐 Checking for leaked secrets...${NC}"
SECRET_PATTERNS=(
    "password.*=.*['\"][^'\"]{6,}"
    "api[_-]?key.*=.*['\"][^'\"]{10,}"
    "secret.*=.*['\"][^'\"]{10,}"
    "token.*=.*['\"][^'\"]{20,}"
    "private[_-]?key"
    "BEGIN.*PRIVATE.*KEY"
    "firebase[_-]?admin.*json"
)

SECRETS_FOUND=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    if echo "$CHANGED_FILES" | xargs grep -l -i -E "$pattern" 2>/dev/null; then
        echo -e "${RED}❌ Potential secret found matching pattern: $pattern${NC}"
        ((SECRETS_FOUND++))
        ((ERRORS++))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No secrets detected${NC}"
fi

# 7. Check commit message format
echo -e "${BLUE}💬 Checking commit message format...${NC}"
COMMIT_MSG_FILE=".git/COMMIT_EDITMSG"
if [ -f "$COMMIT_MSG_FILE" ]; then
    # Check if commit message follows conventional commits format
    FIRST_LINE=$(head -n1 "$COMMIT_MSG_FILE")
    if [[ "$FIRST_LINE" =~ ^(feat|fix|docs|style|refactor|test|chore|ci|perf|build)(\(.+\))?: ]]; then
        echo -e "${GREEN}✅ Commit message format is valid${NC}"
    else
        echo -e "${YELLOW}⚠️  Consider using conventional commit format:${NC}"
        echo "   feat(scope): description"
        echo "   fix(scope): description"
        echo "   docs(scope): description"
        echo "   Current: $FIRST_LINE"
    fi
fi

# 8. Check for TODO comments in production code
echo -e "${BLUE}📝 Checking for TODO comments...${NC}"
TODO_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(ts|tsx|js|jsx)$" | xargs grep -l "TODO\|FIXME\|XXX\|HACK" 2>/dev/null || true)
if [ -n "$TODO_FILES" ]; then
    echo -e "${YELLOW}⚠️  TODO comments found in:${NC}"
    echo "$TODO_FILES" | sed 's/^/    - /'
    echo -e "${YELLOW}⚠️  Consider creating issues for TODOs before production${NC}"
else
    echo -e "${GREEN}✅ No TODO comments found${NC}"
fi

# 9. Check file sizes
echo -e "${BLUE}📏 Checking file sizes...${NC}"
LARGE_FILES=$(echo "$CHANGED_FILES" | xargs ls -la 2>/dev/null | awk '$5 > 1048576 {print $9 " (" $5 " bytes)"}' || true)
if [ -n "$LARGE_FILES" ]; then
    echo -e "${YELLOW}⚠️  Large files detected (>1MB):${NC}"
    echo "$LARGE_FILES" | sed 's/^/    - /'
    echo -e "${YELLOW}⚠️  Consider using Git LFS for large files${NC}"
else
    echo -e "${GREEN}✅ File sizes are reasonable${NC}"
fi

# 10. Check for proper imports
echo -e "${BLUE}📦 Checking import statements...${NC}"
TS_FILES=$(echo "$CHANGED_FILES" | grep -E "\.(ts|tsx)$" || true)
if [ -n "$TS_FILES" ]; then
    IMPORT_ISSUES=0
    echo "$TS_FILES" | while read -r file; do
        # Check for missing .js extensions in relative imports
        if grep -q "from ['\"]\..*[^/]$" "$file" 2>/dev/null; then
            echo -e "${YELLOW}⚠️  Missing .js extension in relative imports: $file${NC}"
            ((IMPORT_ISSUES++))
        fi
        
        # Check for unused imports (basic check)
        if grep -q "import.*{.*}" "$file" 2>/dev/null; then
            # This is a basic check - TypeScript compiler will catch detailed unused imports
            :
        fi
    done
    
    echo -e "${GREEN}✅ Import checks completed${NC}"
else
    echo -e "${GREEN}✅ No TypeScript files to check${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Pre-commit Summary${NC}"
echo "===================="

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed! Ready to commit.${NC}"
    echo ""
    echo -e "${BLUE}📋 Quick post-commit checklist:${NC}"
    echo "  1. Push changes: git push origin main"
    echo "  2. Verify CI/CD pipeline: Check GitHub Actions"
    echo "  3. Update documentation if needed"
    echo "  4. Monitor deployment and error logs"
    exit 0
else
    echo -e "${RED}❌ $ERRORS critical issues found. Commit blocked.${NC}"
    echo ""
    echo -e "${BLUE}🔧 Quick fixes:${NC}"
    echo "  1. Fix TypeScript errors: pnpm typecheck"
    echo "  2. Fix linting errors: pnpm lint:fix"
    echo "  3. Remove any secrets from staged files"
    echo "  4. Review security sensitive changes"
    echo ""
    echo -e "${BLUE}💡 Override (use with caution):${NC}"
    echo "  git commit --no-verify"
    exit 1
fi