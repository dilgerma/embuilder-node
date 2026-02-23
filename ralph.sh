#!/bin/bash
# Ralph - Long-running AI agent loop for event-model driven development
# Usage: ./ralph.sh [max_iterations]

set -euo pipefail

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
ARCHIVE_DIR="$SCRIPT_DIR/archive"

mkdir -p "$ARCHIVE_DIR"

# ------------------------------------------------------------
# Init progress file
# ------------------------------------------------------------
if [[ ! -f "$PROGRESS_FILE" ]]; then
  echo "# Event Model Development Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph – Max iterations: $MAX_ITERATIONS"

# ------------------------------------------------------------
# Main Ralph loop
# ------------------------------------------------------------
for i in $(seq 1 "$MAX_ITERATIONS"); do
  echo
  echo "═══════════════════════════════════════════════════════"
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "═══════════════════════════════════════════════════════"

  echo
  echo ">>> Running Claude at $(date)"
  echo ">>> Iteration $i" >> "$PROGRESS_FILE"

  TMP_OUTPUT=$(mktemp)

  # ---- Run Claude safely -----------------
  CLAUDE_SKIP=false
  while true; do
    cat "$SCRIPT_DIR/prompt.md" \
       | claude --dangerously-skip-permissions 2>&1 \
       | tee "$TMP_OUTPUT" | tee -a "$PROGRESS_FILE"
    CLAUDE_EXIT=${PIPESTATUS[1]}  # exit code of 'claude', not 'tee'

    if [[ $CLAUDE_EXIT -eq 0 ]]; then
      # Success, break out of the retry loop
      break
    elif grep -q "No messages returned" "$TMP_OUTPUT" 2>/dev/null; then
      # Transient error: no messages returned - skip iteration
      echo
      echo "⚠️ Claude returned no messages (transient). Skipping iteration..."
      CLAUDE_SKIP=true
      break
    else
      # Non-zero exit code: probably spending limit reached
      echo
      echo "⚠️ Claude exited with an error. Possibly spending limit reached."
      echo "Waiting 5 minutes before retry..."
      sleep 300  # 5 minutes
    fi
  done
  if [[ "$CLAUDE_SKIP" == "true" ]]; then
    continue
  fi

  OUTPUT=$(cat "$TMP_OUTPUT")
  rm "$TMP_OUTPUT"

  if [[ -z "$OUTPUT" ]]; then
    echo "⚠️ Claude returned no output. Retrying in 1 minute..."
    sleep 60
    continue  # retry
  fi

  # ---- Check for commit review failure -------------------
  if echo "$OUTPUT" | grep -q "❌ COMMIT REVIEW FAILED"; then
    echo
    echo "⚠️  Commit review failed - workspace has been reset"
    echo "📄 Review failure details recorded in progress.txt"
    echo "🔄 Continuing to next iteration..."
    echo
    echo "Review failed at iteration $i - continuing loop" >> "$PROGRESS_FILE"
    echo "Continuing: $(date)" >> "$PROGRESS_FILE"
    echo "---" >> "$PROGRESS_FILE"
    sleep 5  # Brief pause before continuing
    continue  # Continue to next iteration
  fi

  # ---- Completion check -----------------------------------
  if echo "$OUTPUT" | grep -q "<promise>COMPLETE</promise>"; then
    echo
    echo "🎉 Ralph completed all tasks!"
    echo "Completed at iteration $i of $MAX_ITERATIONS"

    echo
    echo "Completed: $(date)" >> "$PROGRESS_FILE"
    exit 0
  fi

  # ---- No tasks available check ---------------------------
  if echo "$OUTPUT" | grep -q "<promise>NO_TASKS</promise>"; then
    echo
    echo "⏳ No tasks available. Waiting 30 seconds before next check..."
    sleep 30
    continue
  fi

  echo
  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo
echo "⚠️ Ralph reached max iterations ($MAX_ITERATIONS) without completing all tasks."
echo "Check $PROGRESS_FILE for status."
exit 1
