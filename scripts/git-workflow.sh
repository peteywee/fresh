#!/bin/bash

# Fresh Git Workflow - Automated commit, document, and push workflow
# Ensures every commit is properly documented and tested before pushing

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
DOCS_WORKFLOW="/workspaces/fresh/scripts/docs-workflow.sh"
PRE_COMMIT_HOOK="/workspaces/fresh/scripts/pre-commit-hook.sh"

echo -e "${BOLD}${BLUE}🚀 Fresh Git Workflow${NC}"
echo "===================="
echo ""

# Function to show usage
show_usage() {
    echo -e "${CYAN}Usage:${NC}"
    echo "  $0 <command> [options]"
    echo ""
    echo -e "${CYAN}Commands:${NC}"
    echo -e "${YELLOW}  commit${NC}     Interactive commit with documentation validation"
    echo -e "${YELLOW}  push${NC}       Validate, commit, and push changes"
    echo -e "${YELLOW}  feature${NC}    Start new feature development workflow"
    echo -e "${YELLOW}  hotfix${NC}     Emergency hotfix workflow"
    echo -e "${YELLOW}  status${NC}     Show repository and documentation status"
    echo -e "${YELLOW}  validate${NC}   Run all validation checks without committing"
    echo ""
    echo -e "${CYAN}Examples:${NC}"
    echo "  $0 commit"
    echo "  $0 push"
    echo "  $0 feature oauth-improvements"
    echo "  $0 hotfix security-patch"
    echo "  $0 status"
}

# Function to check git status
check_git_status() {
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  No changes to commit${NC}"
        exit 0
    fi
}

# Function to validate documentation
validate_documentation() {
    echo -e "${BLUE}📚 Validating documentation...${NC}"
    
    # Check for undocumented changes
    if ! "$DOCS_WORKFLOW" check; then
        echo -e "${YELLOW}⚠️  Documentation validation completed with warnings${NC}"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Commit cancelled${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ Documentation validation passed${NC}"
    fi
}

# Function to run pre-commit validation
run_pre_commit_validation() {
    echo -e "${BLUE}🔍 Running pre-commit validation...${NC}"
    
    if "$PRE_COMMIT_HOOK"; then
        echo -e "${GREEN}✅ Pre-commit validation passed${NC}"
    else
        echo -e "${RED}❌ Pre-commit validation failed${NC}"
        echo ""
        echo -e "${CYAN}💡 Quick fixes:${NC}"
        echo "  - Run 'pnpm typecheck' to fix TypeScript errors"
        echo "  - Run 'pnpm lint:fix' to fix linting issues"
        echo "  - Remove any secrets from staged files"
        echo "  - Review security-sensitive changes"
        echo ""
        read -p "Fix issues and try again, or force commit? (fix/force/cancel): " choice
        case "$choice" in
            fix)
                echo -e "${BLUE}Please fix the issues and run the command again${NC}"
                exit 1
                ;;
            force)
                echo -e "${YELLOW}⚠️  Forcing commit despite validation failures${NC}"
                return 0
                ;;
            *)
                echo -e "${RED}❌ Commit cancelled${NC}"
                exit 1
                ;;
        esac
    fi
}

# Function to handle interactive commit
interactive_commit() {
    echo -e "${BLUE}📝 Starting interactive commit process...${NC}"
    
    # Show current status
    echo -e "${CYAN}Current changes:${NC}"
    git status --short
    echo ""
    
    # Check if all files are staged
    if [ -n "$(git diff --name-only)" ]; then
        echo -e "${YELLOW}⚠️  Unstaged changes detected${NC}"
        read -p "Stage all changes? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add .
            echo -e "${GREEN}✅ All changes staged${NC}"
        else
            echo -e "${BLUE}Please stage your changes manually and run again${NC}"
            exit 1
        fi
    fi
    
    # Validate documentation
    validate_documentation
    
    # Run pre-commit validation
    run_pre_commit_validation
    
    # Get commit message
    echo -e "${BLUE}💬 Commit message (using conventional commits format):${NC}"
    echo -e "${CYAN}Examples:${NC}"
    echo "  feat(auth): add OAuth integration"
    echo "  fix(ui): resolve mobile layout issue"
    echo "  docs(api): update endpoint documentation"
    echo "  refactor(db): optimize query performance"
    echo ""
    read -p "Enter commit message: " commit_message
    
    if [ -z "$commit_message" ]; then
        echo -e "${RED}❌ Commit message cannot be empty${NC}"
        exit 1
    fi
    
    # Validate commit message format
    if [[ ! "$commit_message" =~ ^(feat|fix|docs|style|refactor|test|chore|ci|perf|build)(\(.+\))?: ]]; then
        echo -e "${YELLOW}⚠️  Commit message doesn't follow conventional format${NC}"
        read -p "Continue anyway? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Commit cancelled${NC}"
            exit 1
        fi
    fi
    
    # Commit changes
    git commit -m "$commit_message"
    echo -e "${GREEN}✅ Commit successful!${NC}"
    
    # Ask about pushing
    echo ""
    read -p "Push to remote? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_changes
    fi
}

# Function to push changes
push_changes() {
    echo -e "${BLUE}🚀 Pushing changes to remote...${NC}"
    
    # Get current branch
    current_branch=$(git branch --show-current)
    
    # Check if branch exists on remote
    if git ls-remote --exit-code --heads origin "$current_branch" >/dev/null 2>&1; then
        echo -e "${CYAN}Pushing to existing branch: $current_branch${NC}"
    else
        echo -e "${YELLOW}⚠️  Branch '$current_branch' doesn't exist on remote${NC}"
        read -p "Create new remote branch? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ Push cancelled${NC}"
            exit 1
        fi
    fi
    
    # Push changes
    if git push origin "$current_branch"; then
        echo -e "${GREEN}✅ Push successful!${NC}"
        
        # Show post-push checklist
        echo ""
        echo -e "${BLUE}📋 Post-push checklist:${NC}"
        echo "  1. ✅ Changes pushed to remote"
        echo "  2. 🔍 Check CI/CD pipeline status"
        echo "  3. 📊 Monitor deployment (if auto-deploy enabled)"
        echo "  4. 📧 Notify team if significant changes"
        echo "  5. 📝 Update project management tools"
        
        # Show useful links
        echo ""
        echo -e "${CYAN}🔗 Useful links:${NC}"
        echo "  GitHub Actions: https://github.com/peteywee/fresh/actions"
        echo "  Live Site: https://fresh-app.example.com"
        echo "  Monitoring: https://monitoring.example.com"
        
    else
        echo -e "${RED}❌ Push failed${NC}"
        exit 1
    fi
}

# Function to start feature development
start_feature() {
    local feature_name="$1"
    
    if [ -z "$feature_name" ]; then
        read -p "Enter feature name: " feature_name
    fi
    
    if [ -z "$feature_name" ]; then
        echo -e "${RED}❌ Feature name is required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🆕 Starting feature development: $feature_name${NC}"
    
    # Check if we're on main branch
    current_branch=$(git branch --show-current)
    if [ "$current_branch" != "main" ]; then
        echo -e "${YELLOW}⚠️  Not on main branch (currently on: $current_branch)${NC}"
        read -p "Switch to main branch? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git checkout main
            git pull origin main
        fi
    else
        # Pull latest changes
        git pull origin main
    fi
    
    # Create feature branch
    branch_name="feature/$feature_name"
    git checkout -b "$branch_name"
    echo -e "${GREEN}✅ Created feature branch: $branch_name${NC}"
    
    # Create feature documentation
    "$DOCS_WORKFLOW" new-feature "$feature_name"
    
    echo ""
    echo -e "${BLUE}📋 Feature development checklist:${NC}"
    echo "  1. ✅ Feature branch created"
    echo "  2. ✅ Documentation template created"
    echo "  3. 📝 Fill out feature documentation"
    echo "  4. 💻 Implement feature"
    echo "  5. 🧪 Add/update tests"
    echo "  6. 📚 Update documentation"
    echo "  7. 🔍 Code review"
    echo "  8. 🚀 Deploy to staging"
    echo "  9. ✅ QA validation"
    echo "  10. 🎉 Merge to main"
}

# Function to handle hotfix
handle_hotfix() {
    local hotfix_name="$1"
    
    if [ -z "$hotfix_name" ]; then
        read -p "Enter hotfix name: " hotfix_name
    fi
    
    if [ -z "$hotfix_name" ]; then
        echo -e "${RED}❌ Hotfix name is required${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}🚨 Starting hotfix: $hotfix_name${NC}"
    
    # Switch to main and pull latest
    git checkout main
    git pull origin main
    
    # Create hotfix branch
    branch_name="hotfix/$hotfix_name"
    git checkout -b "$branch_name"
    echo -e "${GREEN}✅ Created hotfix branch: $branch_name${NC}"
    
    echo ""
    echo -e "${RED}🚨 HOTFIX WORKFLOW${NC}"
    echo -e "${YELLOW}This is an emergency hotfix. Please:${NC}"
    echo "  1. 🔍 Identify and fix the critical issue"
    echo "  2. 🧪 Add regression tests"
    echo "  3. 📝 Document the fix"
    echo "  4. 👥 Get immediate code review"
    echo "  5. 🚀 Deploy to production ASAP"
    echo "  6. 📊 Monitor deployment closely"
    echo "  7. 📧 Notify stakeholders"
    echo ""
    echo -e "${CYAN}Remember: Skip non-critical validations if necessary for speed${NC}"
}

# Function to show repository status
show_status() {
    echo -e "${BLUE}📊 Repository Status${NC}"
    echo "==================="
    echo ""
    
    # Git status
    echo -e "${CYAN}📁 Git Status:${NC}"
    git status --short
    if [ -z "$(git status --porcelain)" ]; then
        echo "  No changes"
    fi
    echo ""
    
    # Current branch
    echo -e "${CYAN}🌿 Current Branch:${NC}"
    echo "  $(git branch --show-current)"
    echo ""
    
    # Recent commits
    echo -e "${CYAN}📝 Recent Commits:${NC}"
    git log --oneline -5
    echo ""
    
    # Documentation status
    echo -e "${CYAN}📚 Documentation Status:${NC}"
    "$DOCS_WORKFLOW" check || true
    echo ""
    
    # Pre-commit validation
    echo -e "${CYAN}🔍 Pre-commit Validation:${NC}"
    if [ -n "$(git status --porcelain)" ]; then
        echo "  Staged changes detected - run validation"
    else
        echo "  No staged changes to validate"
    fi
}

# Function to run validation only
run_validation() {
    echo -e "${BLUE}🔍 Running comprehensive validation...${NC}"
    
    # Check if there are changes to validate
    if [ -z "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  No changes to validate${NC}"
        exit 0
    fi
    
    # Stage all changes for validation
    git add .
    
    # Run documentation validation
    validate_documentation
    
    # Run pre-commit validation
    run_pre_commit_validation
    
    echo -e "${GREEN}✅ All validations passed!${NC}"
    echo ""
    echo -e "${CYAN}Ready to commit? Run:${NC}"
    echo "  $0 commit"
}

# Main function
main() {
    local command="$1"
    local param="$2"
    
    case "$command" in
        "commit")
            check_git_status
            interactive_commit
            ;;
        "push")
            check_git_status
            interactive_commit
            ;;
        "feature")
            start_feature "$param"
            ;;
        "hotfix")
            handle_hotfix "$param"
            ;;
        "status")
            show_status
            ;;
        "validate")
            run_validation
            ;;
        "help"|"--help"|"-h"|"")
            show_usage
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $command${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"