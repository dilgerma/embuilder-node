# Git Commit Pre-Tool-Call Hook

This hook system analyzes workspace changes before git commits and provides the diff information to registered analyzer scripts.

## How It Works

1. **Hook Configuration**: The hook is configured in `.claude/settings.local.json` under the `hooks.PreToolUse` section
2. **Trigger**: Runs automatically before any `git commit` command executed by Claude
3. **Analysis**: Executes the main hook script (`analyze-commit.sh`) which:
   - Captures git diff (both staged and unstaged changes)
   - Creates a JSON payload with diff information
   - Passes the payload to all registered analyzer scripts
4. **Analyzers**: Custom TypeScript scripts process the diff and provide feedback

## Configuration

The hook is configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(*git commit*)",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/analyze-commit.sh",
            "statusMessage": "Analyzing changes before commit"
          }
        ]
      }
    ]
  }
}
```

### Configuration Options

- **matcher**: Pattern to match tool calls (e.g., `"Bash(*git commit*)"` for git commits)
- **type**: Hook type (`"command"` for shell commands)
- **command**: Path to the hook script
- **statusMessage**: Message displayed while hook runs

## Hook Payload

The hook provides a JSON payload to analyzer scripts via stdin:

```json
{
  "event": "pre-commit",
  "timestamp": "2026-02-23T12:00:00Z",
  "repository": "/path/to/repo",
  "branch": "main",
  "staged_diff": "diff content...",
  "unstaged_diff": "diff content...",
  "changed_files": ["file1.ts", "file2.ts"],
  "stats": {
    "staged_files": 2,
    "has_staged_changes": true,
    "has_unstaged_changes": false
  }
}
```

## Creating Analyzer Scripts

Analyzer scripts are placed in `.claude/hooks/analyzers/` and can be written in:
- **TypeScript** (`.ts` files) - Recommended
- **Bash** (executable scripts)

### TypeScript Analyzer Example

```typescript
#!/usr/bin/env node

import { readFileSync } from 'fs';

interface HookData {
  event: string;
  timestamp: string;
  repository: string;
  branch: string;
  staged_diff: string;
  unstaged_diff: string;
  changed_files: string[];
  stats: {
    staged_files: number;
    has_staged_changes: boolean;
    has_unstaged_changes: boolean;
  };
}

interface AnalyzerResult {
  approved: boolean;
  reason?: string;
}

async function main() {
  // Read JSON data from stdin
  const input = readFileSync(0, 'utf-8');
  const data: HookData = JSON.parse(input);

  // Your analysis logic here
  console.log('Analyzing commit...');
  console.log(`Files changed: ${data.changed_files.length}`);

  // Perform checks, validations, etc.
  const hasIssues = false; // Your logic here

  // IMPORTANT: Always return approval status as JSON on the last line
  const result: AnalyzerResult = {
    approved: !hasIssues,
    reason: hasIssues ? 'Issues found' : 'All checks passed'
  };

  console.log('\n' + JSON.stringify(result));
}

main();
```

### Requirements for TypeScript Analyzers

TypeScript analyzers require either `tsx` or `ts-node`:

```bash
# Install tsx (recommended - faster)
npm install -g tsx

# Or install ts-node
npm install -g ts-node
```

## Approval Mechanism

**IMPORTANT**: Analyzers must return a JSON result indicating approval status:

```typescript
interface AnalyzerResult {
  approved: boolean;  // true = allow commit, false = block commit
  reason?: string;    // Optional explanation
}
```

### How It Works

1. **Analyzer runs** and performs its checks
2. **Analyzer outputs** any informational messages (logs, warnings, etc.)
3. **Analyzer returns** JSON approval status as the **last line** of output:
   ```json
   {"approved": true, "reason": "All checks passed"}
   ```
4. **Hook script** parses the JSON and:
   - If `approved: false` → **BLOCKS the commit** and shows the reason
   - If `approved: true` → **Allows the commit** to proceed

### Example: Approving Commits

```typescript
// Analysis passed - approve the commit
const result: AnalyzerResult = {
  approved: true,
  reason: 'Code quality checks passed'
};
console.log('\n' + JSON.stringify(result));
```

### Example: Blocking Commits

```typescript
// Critical issue found - block the commit
if (hasSecrets) {
  const result: AnalyzerResult = {
    approved: false,
    reason: 'Potential secrets detected - verify no credentials are committed'
  };
  console.log('\n' + JSON.stringify(result));
  return;
}
```

### What Happens When Blocked

When any analyzer returns `approved: false`, the commit is blocked:

```bash
❌ Commit BLOCKED by analyzers:

  • code-quality-checker.ts: Potential secrets detected
  • commit-blocker.ts: Direct commits to main not allowed

💡 Fix the issues above and try again
```

The git commit command will **fail** and Claude will need to fix the issues before trying again.

## Built-in Analyzers

### 1. example-logger.ts
Simple logger that displays commit statistics and changed files.

**What it does:**
- Shows branch name
- Lists changed files
- Displays staged/unstaged status

**Approval:** Always approves (informational only)

### 2. code-quality-checker.ts
Checks for common code quality issues.

**Checks for:**
- Console.log statements
- Debugger statements
- TODO/FIXME comments
- Potential secrets (API keys, passwords)

**Approval:**
- ✅ Approves: Normal warnings (console.log, TODO, etc.)
- ❌ Blocks: Potential secrets detected

### 3. event-model-validator.ts
Validates event model slice conventions.

**Validates:**
- Event names use past-tense convention
- Test files are updated with logic changes
- Slice structure follows patterns

**Approval:** Always approves (provides warnings but doesn't block)

### 4. commit-blocker-example.ts.disabled
Example showing how to block commits (disabled by default).

**Blocks commits when:**
- Direct commits to main branch
- Too many files changed (>50)
- Critical files changed without tests
- package.json changed without lockfile update

**Enable:** Rename to `commit-blocker-example.ts` to activate

## Enabling/Disabling Analyzers

### Enable an Analyzer
Simply ensure the `.ts` file exists in `.claude/hooks/analyzers/`:

```bash
# Already enabled by default:
.claude/hooks/analyzers/example-logger.ts
.claude/hooks/analyzers/code-quality-checker.ts
.claude/hooks/analyzers/event-model-validator.ts
```

### Disable an Analyzer
Remove or rename the file:

```bash
# Disable by renaming
mv .claude/hooks/analyzers/example-logger.ts \
   .claude/hooks/analyzers/example-logger.ts.disabled

# Or delete
rm .claude/hooks/analyzers/example-logger.ts
```

## Creating Custom Analyzers

### Step 1: Create a new TypeScript file

```bash
touch .claude/hooks/analyzers/my-analyzer.ts
```

### Step 2: Implement your analyzer

```typescript
#!/usr/bin/env node

import { readFileSync } from 'fs';

interface HookData {
  event: string;
  staged_diff: string;
  changed_files: string[];
  // ... other fields
}

async function main() {
  const input = readFileSync(0, 'utf-8');
  const data: HookData = JSON.parse(input);

  // Your custom logic
  console.log('🔍 My Custom Analysis:');

  // Example: Check if package.json changed
  if (data.changed_files.includes('package.json')) {
    console.log('   ⚠️  package.json changed - remember to run npm install');
  }
}

main();
```

### Step 3: Test your analyzer

```bash
# Test manually
echo '{"event":"pre-commit","changed_files":["package.json"],"staged_diff":"..."}' | \
  tsx .claude/hooks/analyzers/my-analyzer.ts
```

## Advanced Usage

### Blocking Commits Based on Conditions

Analyzers can block commits by returning `approved: false`. Here are common patterns:

#### Block Direct Commits to Protected Branches

```typescript
if (data.branch === 'main' || data.branch === 'production') {
  const result: AnalyzerResult = {
    approved: false,
    reason: `Direct commits to ${data.branch} are not allowed - use pull requests`
  };
  console.log('\n' + JSON.stringify(result));
  return;
}
```

#### Block Commits Without Tests

```typescript
const hasLogicChanges = data.changed_files.some(f =>
  f.endsWith('Handler.ts') || f.endsWith('Command.ts')
);

const hasTestChanges = data.changed_files.some(f => f.endsWith('.test.ts'));

if (hasLogicChanges && !hasTestChanges) {
  const result: AnalyzerResult = {
    approved: false,
    reason: 'Logic files changed but no tests updated - add tests'
  };
  console.log('\n' + JSON.stringify(result));
  return;
}
```

#### Block Commits Based on Diff Content

```typescript
const lines = data.staged_diff.split('\n');
const addedLines = lines.filter(l => l.startsWith('+'));

// Block if forbidden patterns found
const hasForbiddenPattern = addedLines.some(line =>
  /eval\(/.test(line) || /dangerouslySetInnerHTML/.test(line)
);

if (hasForbiddenPattern) {
  const result: AnalyzerResult = {
    approved: false,
    reason: 'Forbidden patterns detected (eval, dangerouslySetInnerHTML)'
  };
  console.log('\n' + JSON.stringify(result));
  return;
}
```

### Accessing Additional Git Information

```typescript
import { execSync } from 'child_process';

// Get commit author
const author = execSync('git config user.name').toString().trim();

// Get recent commits
const log = execSync('git log -5 --oneline').toString();

// Check if file exists in previous commit
const fileExists = execSync('git ls-tree -r HEAD --name-only | grep myfile.ts').toString();
```

### Analyzing Specific File Types

```typescript
// Only analyze TypeScript files
const tsFiles = data.changed_files.filter(f => f.endsWith('.ts'));

if (tsFiles.length === 0) {
  console.log('   ℹ️  No TypeScript files changed');
  return;
}

// Analyze each TypeScript file
for (const file of tsFiles) {
  // Extract changes for this specific file
  const fileDiff = extractFileDiff(data.staged_diff, file);
  // ... analyze
}
```

## Troubleshooting

### Hook not running
1. Check `.claude/settings.local.json` has the correct hook configuration
2. Verify the hook script is executable: `chmod +x .claude/hooks/analyze-commit.sh`
3. Check Claude Code permissions allow the hook to run

### TypeScript analyzers not running
1. Install tsx or ts-node: `npm install -g tsx`
2. Verify TypeScript files are in `.claude/hooks/analyzers/`
3. Check for syntax errors in your TypeScript files

### Analyzer fails silently
1. Test manually: `echo '{}' | tsx .claude/hooks/analyzers/your-analyzer.ts`
2. Add error handling in your analyzer
3. Check the JSON payload format matches your interface

## Best Practices

1. **Keep analyzers fast** - They run on every commit
2. **Use clear output** - Emoji and formatting help readability
3. **Always return approval status** - Return JSON with `approved: true/false`
4. **Block only critical issues** - Use `approved: false` sparingly
5. **Provide clear reasons** - Explain why a commit was blocked
6. **Test independently** - Test analyzers outside the hook first
7. **Handle errors gracefully** - Catch exceptions and return approval
8. **Document your analyzers** - Add comments explaining what they check

### When to Block vs Warn

**Block (`approved: false`) when:**
- Secrets/credentials detected
- Direct commits to protected branches
- Critical files changed without tests
- Security vulnerabilities introduced
- Build will definitely fail

**Warn (`approved: true`) when:**
- Code quality issues (console.log, TODOs)
- Style violations
- Missing documentation
- Potential improvements
- Non-critical concerns

## Examples

### Check for Breaking Changes

```typescript
async function main() {
  const input = readFileSync(0, 'utf-8');
  const data: HookData = JSON.parse(input);

  // Check if public API files changed
  const apiFiles = data.changed_files.filter(f =>
    f.includes('/api/') || f.includes('/public/')
  );

  if (apiFiles.length > 0) {
    console.log('⚠️  Public API files changed:');
    apiFiles.forEach(f => console.log(`   - ${f}`));
    console.log('💡 Consider updating CHANGELOG.md');
  }
}
```

### Enforce Commit Size Limits

```typescript
async function main() {
  const input = readFileSync(0, 'utf-8');
  const data: HookData = JSON.parse(input);

  const MAX_FILES = 20;

  if (data.changed_files.length > MAX_FILES) {
    console.error(`❌ Too many files changed (${data.changed_files.length} > ${MAX_FILES})`);
    console.error('💡 Consider breaking this into smaller commits');
    process.exit(1); // Block commit
  }
}
```

### Integration with External Tools

```typescript
import { execSync } from 'child_process';

async function main() {
  const input = readFileSync(0, 'utf-8');
  const data: HookData = JSON.parse(input);

  // Run external linter
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    console.log('✅ Linting passed');
  } catch (error) {
    console.error('❌ Linting failed');
    process.exit(1);
  }
}
```

## Future Enhancements

Potential improvements to the hook system:

- Support for post-commit hooks
- Parallel execution of analyzers
- Configuration file for analyzer settings
- Built-in caching for faster analysis
- Integration with CI/CD pipelines
- Automatic fix suggestions

## Contributing

To add your custom analyzer to the built-in set:

1. Create your analyzer in `.claude/hooks/analyzers/`
2. Test thoroughly
3. Document what it checks
4. Consider making it configurable
5. Share with the team

## License

These hooks are part of the EMBuilder toolkit and follow the same MIT license.
