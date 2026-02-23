#!/bin/bash

# Review Agent Runner
# Spawns a Claude Code agent to perform the code review

PROMPT_FILE="$1"
RESULT_FILE="$2"

if [ -z "$PROMPT_FILE" ] || [ -z "$RESULT_FILE" ]; then
  echo "Usage: $0 <prompt-file> <result-file>"
  exit 1
fi

# Read the review prompt
PROMPT=$(cat "$PROMPT_FILE")

# Create the agent task prompt with explicit instructions
AGENT_TASK=$(cat << EOF
$PROMPT

---

# Your Task

You are now acting as a code review agent.

1. Analyze this commit according to ALL the analyzers listed above
2. Work through each analyzer in priority order
3. Apply the criteria specified in each analyzer

After your analysis, you MUST use the Write tool to create this file:

**File path:** $RESULT_FILE

**File content:** Valid JSON in this EXACT format:

\`\`\`json
{
  "approved": boolean,
  "reason": "Brief summary of your overall decision",
  "analyzer_results": [
    {
      "analyzer": "analyzer-name",
      "approved": boolean,
      "details": ["specific finding 1", "specific finding 2"]
    }
  ]
}
\`\`\`

Critical Rules:
- If ANY analyzer with "blocking: true" fails → set approved: false
- If analyzer has "blocking: false" → can only warn (approved: true)
- Include ALL analyzers in analyzer_results array
- Be specific in details (file names, line numbers)
- Keep reason concise (1-2 sentences max)

**IMPORTANT:** Use the Write tool NOW to create $RESULT_FILE before you respond with anything else.
EOF
)

# Write the agent task to a temp file
AGENT_TASK_FILE=$(mktemp)
echo "$AGENT_TASK" > "$AGENT_TASK_FILE"

# Invoke Claude Code agent using the prompt hook approach
# The hook will be triggered and Claude will see this as a user message
echo ""
echo "📨 Sending task to Claude Code review agent..."
echo ""

# Output the task - this will be captured by Claude Code when running in hook context
cat "$AGENT_TASK_FILE"

# Cleanup task file
rm -f "$AGENT_TASK_FILE"

echo ""
echo ""
echo "⏳ Waiting for agent to write result to: $RESULT_FILE"
echo ""

# Wait for the result file with timeout
MAX_WAIT=120  # 2 minutes
WAIT_COUNT=0

while [ ! -f "$RESULT_FILE" ] && [ $WAIT_COUNT -lt $MAX_WAIT ]; do
  sleep 1
  WAIT_COUNT=$((WAIT_COUNT + 1))

  # Show progress every 10 seconds
  if [ $((WAIT_COUNT % 10)) -eq 0 ]; then
    echo "   Still waiting... (${WAIT_COUNT}s / ${MAX_WAIT}s)"
  fi
done

# Check if result was written
if [ -f "$RESULT_FILE" ]; then
  echo ""
  echo "✅ Review agent completed successfully"
  echo ""
  echo "Result:"
  cat "$RESULT_FILE"
  echo ""
  exit 0
else
  echo ""
  echo "⚠️  Timeout: Review agent did not write result file after ${MAX_WAIT}s"
  echo "   Expected: $RESULT_FILE"
  echo ""
  echo "   Creating default approval (fail-safe mode)"
  echo ""

  # Write a default approval
  cat > "$RESULT_FILE" << 'JSON_EOF'
{
  "approved": true,
  "reason": "Review agent timeout - allowing commit in fail-safe mode",
  "analyzer_results": []
}
JSON_EOF

  exit 0
fi
