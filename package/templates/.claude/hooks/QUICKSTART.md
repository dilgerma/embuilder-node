# Git Commit Hooks - Quick Start

This guide gets you up and running with git commit hooks in 5 minutes.

## Installation

If you installed EMBuilder with `--with-templates`, the hooks are already set up!

```bash
npx @dilgerma/embuilder install --with-templates
```

## Prerequisites

Install `tsx` to run TypeScript analyzers:

```bash
npm install -g tsx
```

## What You Get

When Claude commits code, these analyzers run automatically:

### 1. Code Quality Checker
Warns about:
- `console.log` statements
- `debugger` statements
- TODO/FIXME comments
- Potential secrets (API keys, passwords)

### 2. Event Model Validator
Validates:
- Event names use past-tense
- Tests are updated with logic changes
- Slice structure follows conventions

### 3. Example Logger
Shows:
- Branch name
- Files changed
- Staged/unstaged status

## Try It Out

1. **Make a change and commit**

```bash
echo "console.log('test')" >> test.ts
git add test.ts
git commit -m "test commit"
```

2. **See the hook in action**

You'll see output like:

```
🔍 Running git diff analyzers...
  → Running analyzer: code-quality-checker.ts
🔍 Code Quality Analysis:
   ⚠️  Warnings:
      - Found 1 console.log statement(s) - consider removing debug code
✅ Analyzers completed
```

## Customizing

### Disable an analyzer

```bash
# Rename to disable
mv .claude/hooks/analyzers/example-logger.ts \
   .claude/hooks/analyzers/example-logger.ts.disabled
```

### Create your own analyzer

```bash
# Create new analyzer
cat > .claude/hooks/analyzers/my-check.ts << 'EOF'
#!/usr/bin/env node
import { readFileSync } from 'fs';

interface HookData {
  changed_files: string[];
  staged_diff: string;
}

async function main() {
  const data: HookData = JSON.parse(readFileSync(0, 'utf-8'));

  console.log('🔍 My Custom Check:');

  // Check if package.json changed
  if (data.changed_files.includes('package.json')) {
    console.log('   ⚠️  package.json changed - remember to run npm install');
  }
}

main();
EOF

# Test it
echo '{"changed_files":["package.json"],"staged_diff":""}' | \
  tsx .claude/hooks/analyzers/my-check.ts
```

## Advanced Configuration

Edit `.claude/settings.local.json` to customize:

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
            "statusMessage": "Analyzing changes before commit",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

## Common Use Cases

### Enforce Commit Message Format

Create `.claude/hooks/analyzers/commit-msg-validator.ts`:

```typescript
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

async function main() {
  // Get the last commit message from git
  const msg = execSync('git log -1 --pretty=%B').toString().trim();

  // Check format: "type: description"
  const pattern = /^(feat|fix|docs|style|refactor|test|chore):\s.{10,}$/;

  if (!pattern.test(msg)) {
    console.error('❌ Invalid commit message format');
    console.error('   Expected: "type: description" (at least 10 chars)');
    console.error('   Types: feat, fix, docs, style, refactor, test, chore');
    process.exit(1); // Block commit
  }

  console.log('✅ Commit message format valid');
}

main();
```

### Check for Breaking Changes

Create `.claude/hooks/analyzers/breaking-changes.ts`:

```typescript
import { readFileSync } from 'fs';

interface HookData {
  changed_files: string[];
  staged_diff: string;
}

async function main() {
  const data: HookData = JSON.parse(readFileSync(0, 'utf-8'));

  // Check if public API files changed
  const apiFiles = data.changed_files.filter(f =>
    f.includes('/api/') ||
    f.includes('public') ||
    f.endsWith('types.ts')
  );

  if (apiFiles.length > 0) {
    console.log('⚠️  Public API files changed:');
    apiFiles.forEach(f => console.log(`   - ${f}`));
    console.log('\n💡 Consider:');
    console.log('   - Updating CHANGELOG.md');
    console.log('   - Bumping version number');
    console.log('   - Adding migration guide');
  }
}

main();
```

### Run Tests Before Commit

Create `.claude/hooks/analyzers/run-tests.ts`:

```typescript
import { execSync } from 'child_process';

async function main() {
  console.log('🧪 Running tests...');

  try {
    execSync('npm test', { stdio: 'inherit' });
    console.log('✅ All tests passed');
  } catch (error) {
    console.error('❌ Tests failed - commit blocked');
    process.exit(1);
  }
}

main();
```

## Troubleshooting

### Hook not running?

1. Check configuration in `.claude/settings.local.json`
2. Verify hook script is executable:
   ```bash
   chmod +x .claude/hooks/analyze-commit.sh
   ```

### TypeScript errors?

1. Install tsx: `npm install -g tsx`
2. Check TypeScript syntax in your analyzer
3. Test manually:
   ```bash
   echo '{}' | tsx .claude/hooks/analyzers/your-analyzer.ts
   ```

### Analyzer not executing?

1. Verify file is in `.claude/hooks/analyzers/`
2. Check file has `.ts` extension
3. Look for error messages in hook output

## Next Steps

- Read full documentation: `.claude/hooks/README.md`
- Explore built-in analyzers in `.claude/hooks/analyzers/`
- Share your custom analyzers with the team
- Configure blocking behavior for critical checks

## Help & Support

- Full docs: `.claude/hooks/README.md`
- Report issues: https://github.com/dilgerma/embuilder/issues
- Examples: See `.claude/hooks/analyzers/` directory