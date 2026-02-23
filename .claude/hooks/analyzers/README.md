# Git Commit Analyzers

This directory contains analyzer definitions as markdown files. Each analyzer defines review criteria that an AI agent uses to evaluate git commits before they're committed.

## How It Works

1. **You commit code** - Claude runs `git commit`
2. **Hook triggers** - `.claude/hooks/analyze-commit.sh` is called
3. **Analyzers load** - All `.md` files in this directory are loaded
4. **AI reviews** - A single AI review agent receives:
   - The git diff
   - All analyzer prompts (in priority order)
5. **Decision made** - Agent goes through each analyzer and returns approved/rejected
6. **Commit proceeds or blocks** - Based on the AI's decision

## Analyzer Format

Each analyzer is a markdown file with this structure:

```markdown
# Analyzer Name

## Configuration

\`\`\`yaml
name: analyzer-name
blocking: true|false|secrets-only
priority: 0
\`\`\`

## Prompt

Instructions for the AI review agent...

## Review Criteria

**BLOCK (approved: false) if:**
- Critical condition 1
- Critical condition 2

**WARN but ALLOW (approved: true) if:**
- Warning condition 1
- Warning condition 2

## Response Format

Expected JSON response format...
```

### Configuration Options

- **name**: Identifier for the analyzer
- **blocking**:
  - `true` - Can block commits
  - `false` - Warning only (never blocks)
  - Custom string (e.g., `secrets-only`) - Context-specific blocking
- **priority**: Lower number = runs first (0 is highest priority)

## Built-in Analyzers

### 1. commit-policy.md
**Priority:** 0 (runs first)
**Blocking:** true

Enforces repository policies:
- No direct commits to main/production
- Commit size limits
- Related file changes (package.json + lockfile)

### 2. code-quality.md
**Priority:** 1
**Blocking:** secrets-only

Checks for:
- Debug code (console.log, debugger)
- Security issues (secrets, API keys)
- Code smells (TODOs, magic numbers)

Blocks only on security issues.

### 3. event-model-validator.md
**Priority:** 2
**Blocking:** false

Validates event modeling patterns:
- Event naming (past-tense)
- Command naming (imperative)
- Test coverage
- Slice structure

Warning only, never blocks.

## Creating Custom Analyzers

1. Create a new `.md` file in this directory
2. Follow the format above
3. Define your review criteria clearly
4. Specify blocking behavior

### Example: Database Migration Checker

```markdown
# Database Migration Checker

## Configuration

\`\`\`yaml
name: migration-checker
blocking: true
priority: 1
\`\`\`

## Prompt

You are reviewing database-related changes.

Check if:
1. Migration files are properly named with timestamps
2. Migrations have both up and down methods
3. Breaking schema changes are documented

## Review Criteria

**BLOCK if:**
- Migration file without down method
- Breaking change without migration guide

**ALLOW if:**
- All migrations are complete
- Changes are backward compatible
```

## Disabling Analyzers

Rename the file to include `.disabled`:

```bash
mv code-quality.md code-quality.md.disabled
```

## Testing Analyzers

The review prompt is built by combining:
1. Commit info (branch, files, diff)
2. All analyzer prompts (in priority order)
3. Instructions to return JSON

The AI agent processes all analyzers and returns a single decision.

## Response Format

The AI agent returns:

```json
{
  "approved": boolean,
  "reason": "Overall summary",
  "analyzer_results": [
    {
      "analyzer": "commit-policy",
      "approved": true,
      "details": ["All policies met"]
    },
    {
      "analyzer": "code-quality",
      "approved": false,
      "details": ["Potential API key found in config.ts"]
    }
  ]
}
```

If any `blocking: true` analyzer returns `approved: false`, the commit is blocked.

## Best Practices

1. **Keep prompts focused** - One concern per analyzer
2. **Use clear criteria** - Explicitly state block vs warn conditions
3. **Order by priority** - Critical checks first (lower priority number)
4. **Be specific** - Give the AI clear examples of what to look for
5. **Test thoroughly** - Make test commits to verify analyzer behavior

## Benefits of Markdown Analyzers

- **Easy to read and edit** - No code knowledge required
- **Declarative** - Describe what to check, not how
- **Centralized AI review** - One agent processes all checks
- **Flexible** - Add new analyzers without coding
- **Context-aware** - AI understands nuance better than regex

## Limitations

- Requires AI API access (Claude, GPT, etc.)
- Review speed depends on AI response time
- Cost per commit (API calls)
- Needs network connectivity

For simple pattern matching (e.g., checking for specific file extensions), traditional git hooks may be faster and cheaper. Use markdown analyzers for sophisticated code review that requires understanding context.
