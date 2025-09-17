#!/bin/bash

# Documentation Workflow System
# Ensures comprehensive documentation accompanies every feature and commit

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOCS_DIR="/workspaces/fresh/docs"
TEMPLATES_DIR="$DOCS_DIR/templates"
FEATURES_DIR="$DOCS_DIR/features"
CHANGELOGS_DIR="$DOCS_DIR/changelogs"

echo -e "${BLUE}📚 Fresh Documentation Workflow System${NC}"
echo "======================================="
echo ""

# Create documentation directory structure
create_docs_structure() {
    echo -e "${CYAN}🏗️  Creating documentation structure...${NC}"
    
    mkdir -p "$DOCS_DIR" "$TEMPLATES_DIR" "$FEATURES_DIR" "$CHANGELOGS_DIR"
    mkdir -p "$DOCS_DIR/api" "$DOCS_DIR/components" "$DOCS_DIR/authentication" "$DOCS_DIR/deployment"
    
    echo -e "${GREEN}✅ Documentation structure created${NC}"
}

# Generate feature documentation template
generate_feature_template() {
    local feature_name="$1"
    local template_file="$FEATURES_DIR/${feature_name}_$(date +%Y%m%d).md"
    
    cat > "$template_file" << 'EOF'
# Feature: [FEATURE_NAME]

## Overview
Brief description of what this feature does and why it was needed.

## Implementation Details

### Technical Approach
- **Architecture**: How the feature is structured
- **Dependencies**: What libraries/services it uses  
- **Integration Points**: How it connects with existing systems

### Key Components
- **Files Modified/Added**: List of changed files
- **API Endpoints**: New or modified endpoints
- **Database Changes**: Schema updates if any
- **Configuration**: Environment variables or settings

### Code Examples
```typescript
// Key implementation example
```

## Testing

### Test Coverage
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated  
- [ ] End-to-end tests added/updated
- [ ] Manual testing completed

### Test Results
- **Success Criteria**: What defines success
- **Edge Cases**: Handled scenarios
- **Performance**: Any performance implications

## Security Considerations
- **Authentication**: How auth is handled
- **Authorization**: Permission requirements
- **Data Validation**: Input sanitization
- **Vulnerabilities**: Potential security issues addressed

## User Experience

### UI/UX Changes
- **New Interfaces**: Screenshots or descriptions
- **Modified Workflows**: How user experience changes
- **Accessibility**: A11y considerations
- **Mobile Compatibility**: Responsive design notes

### Error Handling
- **Error Messages**: User-friendly error communication
- **Recovery Flows**: How users can recover from errors
- **Logging**: What gets logged for debugging

## Deployment

### Prerequisites
- **Environment Setup**: Required configurations
- **Dependencies**: Services that must be running
- **Migrations**: Database or data migrations needed

### Rollout Plan
- **Feature Flags**: Gradual rollout strategy
- **Monitoring**: Metrics to watch post-deployment
- **Rollback Plan**: How to revert if issues occur

## Documentation Updates
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Developer documentation updated
- [ ] Changelog entry added

## Future Considerations
- **Scalability**: How this will scale
- **Maintenance**: Ongoing maintenance requirements
- **Technical Debt**: Any shortcuts taken that need addressing
- **Related Features**: Planned future enhancements

## Stakeholder Sign-off
- [ ] Product Owner reviewed
- [ ] Technical Lead approved
- [ ] Security team reviewed (if applicable)
- [ ] QA team verified

---
**Created**: [DATE]
**Author**: [AUTHOR]
**Version**: 1.0
**Status**: [Draft/Review/Approved/Deployed]
EOF

    echo -e "${GREEN}✅ Feature template created: $template_file${NC}"
    echo "$template_file"
}

# Validate documentation completeness
validate_documentation() {
    local feature_name="$1"
    local doc_file="$2"
    local errors=0
    
    echo -e "${CYAN}🔍 Validating documentation for: $feature_name${NC}"
    
    if [ ! -f "$doc_file" ]; then
        echo -e "${RED}❌ Documentation file not found: $doc_file${NC}"
        return 1
    fi
    
    # Check required sections
    local required_sections=(
        "## Overview"
        "## Implementation Details" 
        "## Testing"
        "## Security Considerations"
        "## User Experience"
        "## Deployment"
    )
    
    for section in "${required_sections[@]}"; do
        if ! grep -q "$section" "$doc_file"; then
            echo -e "${RED}❌ Missing required section: $section${NC}"
            ((errors++))
        fi
    done
    
    # Check for placeholder content
    if grep -q "\[FEATURE_NAME\]\|\[DATE\]\|\[AUTHOR\]" "$doc_file"; then
        echo -e "${YELLOW}⚠️  Placeholder content found - please fill in template values${NC}"
        ((errors++))
    fi
    
    # Check for empty sections
    if grep -A 2 "## Testing" "$doc_file" | grep -q "^$"; then
        echo -e "${YELLOW}⚠️  Testing section appears to be empty${NC}"
        ((errors++))
    fi
    
    if [ $errors -eq 0 ]; then
        echo -e "${GREEN}✅ Documentation validation passed${NC}"
        return 0
    else
        echo -e "${RED}❌ Documentation validation failed with $errors issues${NC}"
        return 1
    fi
}

# Generate API documentation
generate_api_docs() {
    echo -e "${CYAN}🔌 Generating API documentation...${NC}"
    
    # Find all API route files
    find /workspaces/fresh/apps/web/app/api -name "route.ts" | while read -r route_file; do
        local endpoint=$(echo "$route_file" | sed 's|/workspaces/fresh/apps/web/app/api||' | sed 's|/route.ts||')
        local doc_file="$DOCS_DIR/api${endpoint}.md"
        
        if [ ! -f "$doc_file" ]; then
            echo -e "${YELLOW}⚠️  Missing API docs for: $endpoint${NC}"
            # Generate basic API doc template
            mkdir -p "$(dirname "$doc_file")"
            cat > "$doc_file" << EOF
# API Endpoint: $endpoint

## Overview
[Description of what this endpoint does]

## HTTP Methods
- \`GET\` - [Description]
- \`POST\` - [Description]  
- \`PUT\` - [Description]
- \`DELETE\` - [Description]

## Request Format
\`\`\`json
{
  "field": "value"
}
\`\`\`

## Response Format
\`\`\`json
{
  "success": true,
  "data": {}
}
\`\`\`

## Error Codes
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`500\` - Internal Server Error

## Examples
\`\`\`bash
curl -X GET http://localhost:3000/api$endpoint
\`\`\`

## Authentication
[Authentication requirements]

## Rate Limiting
[Rate limiting information]

---
**Last Updated**: $(date +%Y-%m-%d)
EOF
        fi
    done
    
    echo -e "${GREEN}✅ API documentation templates generated${NC}"
}

# Check for undocumented changes
check_undocumented_changes() {
    echo -e "${CYAN}🔍 Checking for undocumented changes...${NC}"
    
    # Get list of changed files in last commit
    local changed_files=$(git diff --name-only HEAD~1 HEAD 2>/dev/null || echo "")
    local undocumented=0
    
    if [ -z "$changed_files" ]; then
        echo -e "${YELLOW}⚠️  No recent changes found${NC}"
        return 0
    fi
    
    echo "Changed files in last commit:"
    echo "$changed_files" | while read -r file; do
        echo "  - $file"
        
        # Check if it's a significant change that needs documentation
        if [[ "$file" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$file" =~ \.test\. ]] && [[ ! "$file" =~ \.spec\. ]]; then
            # Check if there's corresponding documentation
            local doc_exists=false
            
            # Check for API documentation
            if [[ "$file" =~ app/api/.*route\.ts$ ]]; then
                local endpoint=$(echo "$file" | sed 's|apps/web/app/api||' | sed 's|/route.ts||')
                if [ -f "$DOCS_DIR/api${endpoint}.md" ]; then
                    doc_exists=true
                fi
            fi
            
            # Check for component documentation
            if [[ "$file" =~ components/.*\.(ts|tsx)$ ]]; then
                local component=$(basename "$file" .tsx)
                component=$(basename "$component" .ts)
                if [ -f "$DOCS_DIR/components/${component}.md" ]; then
                    doc_exists=true
                fi
            fi
            
            # Check for feature documentation
            if [ "$(find "$FEATURES_DIR" -name "*$(date +%Y%m%d)*" | wc -l)" -gt 0 ]; then
                doc_exists=true
            fi
            
            if [ "$doc_exists" = false ]; then
                echo -e "${YELLOW}⚠️  No documentation found for: $file${NC}"
                ((undocumented++))
            fi
        fi
    done
    
    if [ $undocumented -gt 0 ]; then
        echo -e "${RED}❌ Found $undocumented files with potential undocumented changes${NC}"
        return 1
    else
        echo -e "${GREEN}✅ All significant changes appear to be documented${NC}"
        return 0
    fi
}

# Main workflow function
main() {
    local command="$1"
    local feature_name="$2"
    
    case "$command" in
        "init")
            create_docs_structure
            generate_api_docs
            echo -e "${GREEN}🎉 Documentation workflow initialized!${NC}"
            ;;
        "new-feature")
            if [ -z "$feature_name" ]; then
                echo -e "${RED}❌ Feature name required: ./docs-workflow.sh new-feature <feature-name>${NC}"
                exit 1
            fi
            template_file=$(generate_feature_template "$feature_name")
            echo -e "${BLUE}📝 Edit your feature documentation:${NC}"
            echo "   $template_file"
            ;;
        "validate")
            if [ -z "$feature_name" ]; then
                echo -e "${RED}❌ Feature name required: ./docs-workflow.sh validate <feature-name>${NC}"
                exit 1
            fi
            doc_file="$FEATURES_DIR/${feature_name}_$(date +%Y%m%d).md"
            validate_documentation "$feature_name" "$doc_file"
            ;;
        "check")
            check_undocumented_changes
            ;;
        "api-docs")
            generate_api_docs
            ;;
        "help"|*)
            echo -e "${BLUE}📚 Fresh Documentation Workflow Commands:${NC}"
            echo ""
            echo -e "${CYAN}Initialization:${NC}"
            echo "  init                     Initialize documentation structure"
            echo ""
            echo -e "${CYAN}Feature Documentation:${NC}"
            echo "  new-feature <name>       Create new feature documentation template"
            echo "  validate <name>          Validate feature documentation completeness"
            echo ""
            echo -e "${CYAN}Quality Assurance:${NC}"
            echo "  check                    Check for undocumented changes"
            echo "  api-docs                 Generate API documentation templates"
            echo ""
            echo -e "${CYAN}Examples:${NC}"
            echo "  ./docs-workflow.sh init"
            echo "  ./docs-workflow.sh new-feature oauth-integration"
            echo "  ./docs-workflow.sh validate oauth-integration"
            echo "  ./docs-workflow.sh check"
            ;;
    esac
}

# Run main function with all arguments
main "$@"