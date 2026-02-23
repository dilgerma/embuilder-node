#!/usr/bin/env node

/**
 * Git Commit Analyzer - Main Entry Point
 *
 * This script:
 * 1. Collects git diff information
 * 2. Loads all analyzer markdown files
 * 3. Sends everything to a review agent
 * 4. The agent goes through each analyzer and returns approved/rejected
 */

import { execSync } from 'child_process';
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

interface SliceInfo {
  id: string;
  slice: string;
  index: number;
  context: string;
  folder: string;
  status: string;
}

interface HookData {
  event: string;
  timestamp: string;
  repository: string;
  branch: string;
  staged_diff: string;
  unstaged_diff: string;
  changed_files: string[];
  current_slice?: SliceInfo;
  stats: {
    staged_files: number;
    has_staged_changes: boolean;
    has_unstaged_changes: boolean;
  };
}

interface AnalyzerDefinition {
  name: string;
  filepath: string;
  content: string;
  priority: number;
  blocking: boolean | string;
}

interface ReviewResult {
  approved: boolean;
  reason: string;
  analyzer_results: Array<{
    analyzer: string;
    approved: boolean;
    details: string[];
  }>;
}

function getCurrentSlice(): SliceInfo | undefined {
  try {
    const slicesIndexPath = join('.slices', 'index.json');
    const indexContent = readFileSync(slicesIndexPath, 'utf-8');
    const slices: SliceInfo[] = JSON.parse(indexContent);

    // Find the slice with status "in_progress" or "In Progress" (case insensitive)
    const currentSlice = slices.find(s =>
      s.status.toLowerCase() === 'in_progress' ||
      s.status.toLowerCase() === 'in progress'
    );

    return currentSlice;
  } catch (error) {
    // No .slices/index.json or parsing error - that's OK
    return undefined;
  }
}

function getGitInfo(): HookData {
  let stagedDiff = '';
  let unstagedDiff = '';
  let changedFiles: string[] = [];
  let repository = 'unknown';
  let branch = 'unknown';

  try {
    stagedDiff = execSync('git diff --cached', { encoding: 'utf-8' });
  } catch {
    stagedDiff = '';
  }

  try {
    unstagedDiff = execSync('git diff', { encoding: 'utf-8' });
  } catch {
    unstagedDiff = '';
  }

  try {
    const filesOutput = execSync('git diff --name-only --cached', { encoding: 'utf-8' });
    changedFiles = filesOutput.split('\n').filter(f => f.trim());
  } catch {
    changedFiles = [];
  }

  try {
    repository = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' }).trim();
  } catch {
    repository = 'unknown';
  }

  try {
    branch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
  } catch {
    branch = 'unknown';
  }

  // Get current slice information
  const currentSlice = getCurrentSlice();

  return {
    event: 'pre-commit',
    timestamp: new Date().toISOString(),
    repository,
    branch,
    staged_diff: stagedDiff,
    unstaged_diff: unstagedDiff,
    changed_files: changedFiles,
    current_slice: currentSlice,
    stats: {
      staged_files: changedFiles.length,
      has_staged_changes: stagedDiff.length > 0,
      has_unstaged_changes: unstagedDiff.length > 0
    }
  };
}

function loadAnalyzers(analyzersDir: string): AnalyzerDefinition[] {
  const analyzers: AnalyzerDefinition[] = [];

  try {
    const files = readdirSync(analyzersDir)
      .filter(f => f.endsWith('.md'))
      .filter(f => !f.includes('.disabled'));

    for (const file of files) {
      const filepath = join(analyzersDir, file);
      const content = readFileSync(filepath, 'utf-8');

      // Extract configuration from YAML frontmatter
      const configMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
      let priority = 999;
      let blocking: boolean | string = false;
      let name = file.replace('.md', '');

      if (configMatch) {
        const yamlContent = configMatch[1];
        const priorityMatch = yamlContent.match(/priority:\s*(\d+)/);
        const blockingMatch = yamlContent.match(/blocking:\s*(\S+)/);
        const nameMatch = yamlContent.match(/name:\s*(.+)/);

        if (priorityMatch) priority = parseInt(priorityMatch[1]);
        if (blockingMatch) {
          const blockingValue = blockingMatch[1].trim();
          blocking = blockingValue === 'true' ? true :
                    blockingValue === 'false' ? false :
                    blockingValue;
        }
        if (nameMatch) name = nameMatch[1].trim();
      }

      analyzers.push({
        name,
        filepath,
        content,
        priority,
        blocking: blocking
      });
    }

    // Sort by priority (lower number = higher priority)
    analyzers.sort((a, b) => a.priority - b.priority);

  } catch (error: any) {
    console.error(`Error loading analyzers: ${error.message}`);
  }

  return analyzers;
}

function buildReviewPrompt(hookData: HookData, analyzers: AnalyzerDefinition[]): string {
  const sliceContext = hookData.current_slice ? `
## Current Slice (In Progress)

**Slice:** ${hookData.current_slice.slice}
**Context:** ${hookData.current_slice.context}
**Folder:** ${hookData.current_slice.folder}
**Status:** ${hookData.current_slice.status}

This commit is part of implementing the "${hookData.current_slice.slice}" slice in the "${hookData.current_slice.context}" context.
Changes should be related to the \`${hookData.current_slice.folder}\` folder.

---
` : '';

  return `You are a code review agent analyzing a git commit before it's committed.

# Commit Information

**Branch:** ${hookData.branch}
**Files Changed:** ${hookData.changed_files.length}
**Timestamp:** ${hookData.timestamp}

${sliceContext}
## Changed Files
${hookData.changed_files.map(f => `- ${f}`).join('\n')}

## Staged Diff
\`\`\`diff
${hookData.staged_diff || '(no staged changes)'}
\`\`\`

---

# Your Task

Go through each analyzer below **in order** and evaluate the commit against its criteria.
Each analyzer has specific blocking/warning rules.

${analyzers.map((analyzer, idx) => `
## Analyzer ${idx + 1}: ${analyzer.name}

${analyzer.content}

---
`).join('\n')}

# Final Decision

After reviewing all analyzers, return your decision as JSON:

\`\`\`json
{
  "approved": boolean,
  "reason": "Summary of the decision",
  "analyzer_results": [
    {
      "analyzer": "analyzer-name",
      "approved": boolean,
      "details": ["finding 1", "finding 2"]
    }
  ]
}
\`\`\`

**IMPORTANT:**
- If ANY analyzer with \`blocking: true\` rejects, set \`approved: false\`
- If analyzer has \`blocking: false\`, it can only warn (still \`approved: true\`)
- Work through analyzers in the order given (by priority)
- Be thorough but concise in your analysis
`;
}

async function runReview(prompt: string): Promise<ReviewResult> {
  console.log('🤖 Launching dedicated review agent...');
  console.log('');

  try {
    const { writeFileSync, mkdtempSync, rmSync, existsSync } = await import('fs');
    const { tmpdir } = await import('os');
    const { join } = await import('path');

    // Create temp directory for review files
    const tempDir = mkdtempSync(join(tmpdir(), 'commit-review-'));
    const promptFile = join(tempDir, 'review-prompt.md');
    const resultFile = join(tempDir, 'review-result.json');

    // Write the comprehensive review prompt
    writeFileSync(promptFile, prompt);

    // Create the command that will be executed by the review agent
    const reviewCommand = `
cat "${promptFile}"
echo ""
echo "---"
echo ""
echo "Please analyze this commit and write your JSON response to: ${resultFile}"
echo ""
echo "The JSON must have this exact structure:"
echo '{"approved": boolean, "reason": "string", "analyzer_results": [{"analyzer": "name", "approved": boolean, "details": []}]}'
    `.trim();

    console.log('   Review prompt saved to:', promptFile);
    console.log('   Result will be written to:', resultFile);
    console.log('');

    // Run the review agent script
    const reviewAgentScript = join('.claude', 'hooks', 'run-review-agent.sh');
    execSync(`"${reviewAgentScript}" "${promptFile}" "${resultFile}"`, {
      encoding: 'utf-8',
      stdio: 'inherit',
      shell: '/bin/bash'
    });

    console.log('');
    console.log('⏳ Waiting for review agent to complete...');
    console.log('   (Agent should write result to:', resultFile, ')');
    console.log('');

    // Wait for result file (with timeout)
    const maxWaitTime = 120000; // 2 minutes
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (!existsSync(resultFile)) {
      if (Date.now() - startTime > maxWaitTime) {
        throw new Error('Timeout waiting for review agent to write result');
      }
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Read the result
    const resultContent = readFileSync(resultFile, 'utf-8');
    let reviewResult: ReviewResult;

    try {
      // Try to parse as JSON
      reviewResult = JSON.parse(resultContent);
    } catch (error) {
      // Try to extract JSON from the content
      const jsonMatch = resultContent.match(/\{[\s\S]*"approved"[\s\S]*\}/);
      if (jsonMatch) {
        reviewResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse review result as JSON');
      }
    }

    // Cleanup
    rmSync(tempDir, { recursive: true, force: true });

    return reviewResult;

  } catch (error: any) {
    console.error(`⚠️  Review agent error: ${error.message}`);
    console.log('   Allowing commit (fail-safe mode)\n');

    // Fail-open: approve on error
    return {
      approved: true,
      reason: 'Review agent failed - allowing commit in fail-safe mode',
      analyzer_results: []
    };
  }
}

async function main() {
  try {
    console.log('🔍 Analyzing commit with AI-powered reviewers...\n');

    // Get git information
    const hookData = getGitInfo();

    if (hookData.changed_files.length === 0) {
      console.log('ℹ️  No files to commit');
      process.exit(0);
    }

    // Display current slice if available
    if (hookData.current_slice) {
      console.log('📦 Current Slice:');
      console.log(`   ${hookData.current_slice.slice}`);
      console.log(`   Context: ${hookData.current_slice.context}`);
      console.log(`   Folder: ${hookData.current_slice.folder}\n`);
    }

    // Load all analyzer definitions
    const analyzersDir = join('.claude', 'hooks', 'analyzers');
    const analyzers = loadAnalyzers(analyzersDir);

    if (analyzers.length === 0) {
      console.log(`ℹ️  No analyzer definitions found in ${analyzersDir}`);
      console.log('   Create .md files with analyzer prompts');
      process.exit(0);
    }

    console.log(`📋 Loaded ${analyzers.length} analyzers:`);
    analyzers.forEach(a => {
      const blockIcon = a.blocking === true ? '🔒' :
                       a.blocking === false ? '💡' : `⚠️ `;
      console.log(`   ${blockIcon} ${a.name} (priority: ${a.priority})`);
    });
    console.log('');

    // Build the comprehensive review prompt
    const reviewPrompt = buildReviewPrompt(hookData, analyzers);

    // TODO: Send to AI review agent (Claude API)
    const reviewResult = await runReview(reviewPrompt);

    // Display results
    console.log('📊 Review Results:\n');

    for (const result of reviewResult.analyzer_results) {
      const icon = result.approved ? '✅' : '❌';
      console.log(`${icon} ${result.analyzer}`);

      if (result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`   ${detail}`);
        });
      }
      console.log('');
    }

    // Final decision
    if (reviewResult.approved) {
      console.log('✅ Commit APPROVED');
      console.log(`   ${reviewResult.reason}\n`);
      process.exit(0);
    } else {
      console.log('❌ Commit REJECTED');
      console.log(`   ${reviewResult.reason}\n`);
      console.log('💡 Fix the issues above and try again\n');
      process.exit(1);
    }

  } catch (error: any) {
    console.error(`❌ Error: ${error.message}`);
    // Fail-open: allow commit on error
    console.log('⚠️  Allowing commit (fail-safe mode)\n');
    process.exit(0);
  }
}

main();
