#!/bin/bash

# Review Agent Runner
# This script is called with the prompt file and result file paths

PROMPT_FILE="$1"
RESULT_FILE="$2"

if [ -z "$PROMPT_FILE" ] || [ -z "$RESULT_FILE" ]; then
  echo "Usage: $0 <prompt-file> <result-file>"
  exit 1
fi

# Read the prompt
PROMPT=$(cat "$PROMPT_FILE")

# Output the prompt for visibility
echo "=== REVIEW PROMPT ==="
echo "$PROMPT"
echo "===================="
echo ""

# Instructions for the agent
echo "Please analyze the commit above and provide your review."
echo ""
echo "Return ONLY valid JSON in this format:"
cat << 'EOF'
{
  "approved": boolean,
  "reason": "Summary of decision",
  "analyzer_results": [
    {
      "analyzer": "analyzer-name",
      "approved": boolean,
      "details": ["detail 1", "detail 2"]
    }
  ]
}
EOF

echo ""
echo "Write the JSON to: $RESULT_FILE"
echo ""

# This is where Claude Code's AI would process the prompt
# For now, we expect the user/AI to write the result manually or via another mechanism
# In a full implementation, this would call Claude API or use Claude Code's agent system

exit 0
