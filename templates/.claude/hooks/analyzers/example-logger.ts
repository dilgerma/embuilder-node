#!/usr/bin/env node

/**
 * Example Analyzer: Simple Logger
 *
 * This analyzer receives git diff information and logs basic statistics.
 * It demonstrates how to parse the JSON payload and extract useful information.
 * Always approves commits.
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

interface AnalyzerResult {
  approved: boolean;
  reason?: string;
}

async function main() {
  try {
    // Read JSON data from stdin
    const input = readFileSync(0, 'utf-8');
    const data: HookData = JSON.parse(input);

    console.log('📊 Commit Analysis:');
    console.log(`   Branch: ${data.branch}`);
    console.log(`   Files changed: ${data.changed_files.length}`);
    console.log(`   Has staged changes: ${data.stats.has_staged_changes}`);
    console.log(`   Has unstaged changes: ${data.stats.has_unstaged_changes}`);

    // Log changed files
    if (data.changed_files.length > 0) {
      console.log('\n📁 Changed files:');
      data.changed_files.forEach(file => {
        if (file.trim()) {
          console.log(`   - ${file}`);
        }
      });
    }

    // Always approve - this is just an informational analyzer
    const result: AnalyzerResult = {
      approved: true,
      reason: 'Logger - informational only'
    };

    console.log('\n' + JSON.stringify(result));

  } catch (error) {
    console.error('❌ Error in analyzer:', error);
    console.log(JSON.stringify({ approved: true, reason: 'analyzer_error' }));
    process.exit(1);
  }
}

main();
