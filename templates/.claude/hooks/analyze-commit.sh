#!/bin/bash

# Git Commit Pre-Tool-Call Hook (Bash Wrapper)
# This is a minimal wrapper that calls the TypeScript implementation

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if tsx is available
if command -v tsx &> /dev/null; then
  tsx "$SCRIPT_DIR/analyze-commit.ts"
  exit $?
elif command -v ts-node &> /dev/null; then
  ts-node "$SCRIPT_DIR/analyze-commit.ts"
  exit $?
else
  echo "❌ Error: tsx or ts-node not found"
  echo "   Install with: npm install -g tsx"
  echo ""
  echo "   Allowing commit to proceed (fail-safe mode)"
  exit 0
fi
