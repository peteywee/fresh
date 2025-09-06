#!/usr/bin/env bash
set -e

# Usage: ./scripts/create-file.sh path/to/file.ext <<'EOF'
# file contents here
# EOF

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: $0 <file-path>"
  exit 1
fi

DIR=$(dirname "$FILE")
mkdir -p "$DIR"

cat > "$FILE"
echo "Created $FILE"
