#!/bin/bash

# Check Review Result - Step 3 of 3 in commit review process
# Reads the review result and approves/rejects the commit

echo "Checking Review"

# Find the temp directory from the last prepare-review run
# We need to look for recent temp directories
LATEST_TEMP=$(find /tmp -maxdepth 1 -name "tmp.*" -type d -newer /tmp -print 2>/dev/null | head -1)

if [ -z "$LATEST_TEMP" ]; then
  # Fallback: look for any recent commit-review temp dir
  LATEST_TEMP=$(find /tmp -maxdepth 1 -name "commit-review-*" -type d 2>/dev/null | sort -r | head -1)
fi

if [ -z "$LATEST_TEMP" ] || [ ! -f "$LATEST_TEMP/result-path.txt" ]; then
  echo "⚠️  Could not find review result files (fail-safe: allowing commit)"
  exit 0
fi

REVIEW_RESULT_FILE=$(cat "$LATEST_TEMP/result-path.txt")
REVIEW_TEMP_DIR=$(cat "$LATEST_TEMP/temp-dir.txt" 2>/dev/null || echo "$LATEST_TEMP")

# Check if review result exists
if [ ! -f "$REVIEW_RESULT_FILE" ]; then
  echo "⚠️  Review agent did not create result file (fail-safe: allowing commit)"
  rm -rf "$REVIEW_TEMP_DIR"
  exit 0
fi

# Parse the result using the TypeScript script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v tsx &> /dev/null; then
  tsx "$SCRIPT_DIR/analyze-commit.ts" check "$REVIEW_RESULT_FILE"
  EXIT_CODE=$?
elif command -v ts-node &> /dev/null; then
  ts-node "$SCRIPT_DIR/analyze-commit.ts" check "$REVIEW_RESULT_FILE"
  EXIT_CODE=$?
else
  echo "⚠️  Cannot check result (fail-safe: allowing commit)"
  EXIT_CODE=0
fi

# Cleanup
rm -rf "$REVIEW_TEMP_DIR"

exit $EXIT_CODE
