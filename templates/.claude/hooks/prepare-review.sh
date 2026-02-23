#!/bin/bash

# Prepare Review - Step 1 of 3 in commit review process
# Generates the review prompt and sets up file paths for the review agent

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create temp directory for review files
TEMP_DIR=$(mktemp -d)
export REVIEW_PROMPT_FILE="$TEMP_DIR/review-prompt.md"
export REVIEW_RESULT_FILE="$TEMP_DIR/review-result.json"
export REVIEW_TEMP_DIR="$TEMP_DIR"

# Store these in a file so check-review-result.sh can access them
echo "$REVIEW_PROMPT_FILE" > "$TEMP_DIR/prompt-path.txt"
echo "$REVIEW_RESULT_FILE" > "$TEMP_DIR/result-path.txt"
echo "$REVIEW_TEMP_DIR" > "$TEMP_DIR/temp-dir.txt"

# Run the TypeScript orchestrator to generate the review prompt
if command -v tsx &> /dev/null; then
  tsx "$SCRIPT_DIR/analyze-commit.ts" prepare "$REVIEW_PROMPT_FILE" "$REVIEW_RESULT_FILE"
elif command -v ts-node &> /dev/null; then
  ts-node "$SCRIPT_DIR/analyze-commit.ts" prepare "$REVIEW_PROMPT_FILE" "$REVIEW_RESULT_FILE"
else
  echo "❌ Error: tsx or ts-node not found"
  echo "   Install with: npm install -g tsx"
  exit 0  # Fail-safe: allow commit
fi

# Export for the prompt hook to use
echo "export REVIEW_PROMPT_FILE='$REVIEW_PROMPT_FILE'" >> "$TEMP_DIR/env.sh"
echo "export REVIEW_RESULT_FILE='$REVIEW_RESULT_FILE'" >> "$TEMP_DIR/env.sh"

exit 0
