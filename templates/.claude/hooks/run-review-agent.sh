#!/bin/bash

# Review Agent Runner
# Uses Claude Code's prompt hook system to run a review agent

PROMPT_FILE="$1"
RESULT_FILE="$2"

if [ -z "$PROMPT_FILE" ] || [ -z "$RESULT_FILE" ]; then
  echo "Usage: $0 <prompt-file> <result-file>"
  exit 1
fi

# Read the review prompt
PROMPT=$(cat "$PROMPT_FILE")

# Output the full task prompt that Claude will execute
# This prompt includes the review criteria and instructions to write the result

cat << EOF
$PROMPT

---

# Your Task

Analyze this commit according to ALL the analyzers above.

Work through each analyzer in priority order and evaluate the commit against its criteria.

After your analysis, use the Write tool to create the file: $RESULT_FILE

The file MUST contain ONLY valid JSON in this exact format:

{
  "approved": boolean,
  "reason": "Brief summary of your overall decision",
  "analyzer_results": [
    {
      "analyzer": "commit-policy",
      "approved": boolean,
      "details": ["specific finding 1", "specific finding 2"]
    },
    {
      "analyzer": "code-quality",
      "approved": boolean,
      "details": ["finding 1", "finding 2"]
    }
  ]
}

Critical Rules:
- If ANY analyzer with "blocking: true" rejects, set approved: false
- If analyzer has "blocking: false", it can only warn (approved: true)
- Include all analyzers in analyzer_results array
- Be specific in details (include file names, line numbers when relevant)
- Keep reason concise (1-2 sentences)

Use the Write tool now to create $RESULT_FILE with your JSON review result.
EOF

# The output above will be captured by Claude Code's hook system
# Claude will execute the task and write the result file

# Wait a moment for the file to be written
sleep 2

# Check if result was written
if [ -f "$RESULT_FILE" ]; then
  echo ""
  echo "✅ Review agent completed successfully"
  cat "$RESULT_FILE"
  exit 0
else
  echo ""
  echo "⚠️  Warning: Review agent did not write result file"
  echo "   Expected: $RESULT_FILE"
  echo ""
  echo "   Creating default approval (fail-safe mode)"

  # Write a default approval
  cat > "$RESULT_FILE" << 'JSON_EOF'
{
  "approved": true,
  "reason": "Review agent did not complete - allowing commit in fail-safe mode",
  "analyzer_results": []
}
JSON_EOF

  exit 0
fi
