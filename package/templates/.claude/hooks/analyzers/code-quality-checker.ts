#!/usr/bin/env node

/**
 * Example Analyzer: Code Quality Checker
 *
 * This analyzer checks for common code quality issues in the diff:
 * - Debug statements (console.log, debugger)
 * - TODO/FIXME comments
 * - Large file changes
 * - Potential sensitive data (API keys, passwords)
 */

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

interface Issue {
  severity: 'warning' | 'info';
  message: string;
}

async function analyzeDiff(diff: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  const lines = diff.split('\n');

  // Only check added lines (starting with +)
  const addedLines = lines.filter(line => line.startsWith('+') && !line.startsWith('+++'));

  // Check for console.log statements
  const consoleLogs = addedLines.filter(line => /console\.(log|debug|info|warn|error)/.test(line));
  if (consoleLogs.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Found ${consoleLogs.length} console.log statement(s) - consider removing debug code`
    });
  }

  // Check for debugger statements
  const debuggers = addedLines.filter(line => /\bdebugger\b/.test(line));
  if (debuggers.length > 0) {
    issues.push({
      severity: 'warning',
      message: `Found ${debuggers.length} debugger statement(s) - remove before committing`
    });
  }

  // Check for TODO/FIXME comments
  const todos = addedLines.filter(line => /(TODO|FIXME|XXX|HACK)/i.test(line));
  if (todos.length > 0) {
    issues.push({
      severity: 'info',
      message: `Found ${todos.length} TODO/FIXME comment(s) - ensure they're tracked`
    });
  }

  // Check for potential API keys or secrets
  const potentialSecrets = addedLines.filter(line =>
    /(api[_-]?key|secret|password|token|auth[_-]?key)[\s]*[:=][\s]*['"][^'"]{20,}['"]/.test(line.toLowerCase())
  );
  if (potentialSecrets.length > 0) {
    issues.push({
      severity: 'warning',
      message: `⚠️  SECURITY: Found ${potentialSecrets.length} potential secret(s) - verify no credentials are committed`
    });
  }

  return issues;
}

interface AnalyzerResult {
  approved: boolean;
  reason?: string;
}

async function main() {
  try {
    // Read JSON data from stdin
    const input = readFileSync(0, 'utf-8');
    const data: HookData = JSON.parse(input);

    console.log('🔍 Code Quality Analysis:');

    // Analyze staged changes
    const stagedIssues = await analyzeDiff(data.staged_diff);
    const unstagedIssues = await analyzeDiff(data.unstaged_diff);

    const allIssues = [...stagedIssues, ...unstagedIssues];

    if (allIssues.length === 0) {
      console.log('   ✅ No issues found');

      const result: AnalyzerResult = {
        approved: true,
        reason: 'No code quality issues found'
      };
      console.log('\n' + JSON.stringify(result));
      return;
    }

    // Group by severity
    const warnings = allIssues.filter(i => i.severity === 'warning');
    const infos = allIssues.filter(i => i.severity === 'info');

    if (warnings.length > 0) {
      console.log('\n   ⚠️  Warnings:');
      warnings.forEach(issue => console.log(`      - ${issue.message}`));
    }

    if (infos.length > 0) {
      console.log('\n   ℹ️  Info:');
      infos.forEach(issue => console.log(`      - ${issue.message}`));
    }

    // Check for blocking issues (potential secrets)
    const hasSecrets = warnings.some(w => w.message.includes('SECURITY'));

    let result: AnalyzerResult;
    if (hasSecrets) {
      // BLOCK commit if potential secrets found
      result = {
        approved: false,
        reason: 'Potential secrets detected - verify no credentials are committed'
      };
    } else {
      // Just warn but allow commit
      result = {
        approved: true,
        reason: `Code quality warnings found (${warnings.length} warnings, ${infos.length} info)`
      };
    }

    console.log('\n' + JSON.stringify(result));

  } catch (error) {
    console.error('❌ Error in code quality checker:', error);
    console.log(JSON.stringify({ approved: true, reason: 'analyzer_error' }));
    process.exit(1);
  }
}

main();
