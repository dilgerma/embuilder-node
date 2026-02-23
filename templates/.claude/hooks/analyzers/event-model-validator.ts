#!/usr/bin/env node

/**
 * Example Analyzer: Event Model Validator
 *
 * This analyzer validates changes to event model slices:
 * - Checks if event names follow past-tense convention
 * - Validates command naming (imperative form)
 * - Ensures test files are updated when logic changes
 * - Verifies TypeScript files follow slice structure
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

interface ValidationResult {
  valid: boolean;
  warnings: string[];
  suggestions: string[];
}

function validateEventNames(diff: string): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Look for event definitions in the diff
  const eventPattern = /interface\s+(\w+Event)\s*{/g;
  const lines = diff.split('\n').filter(line => line.startsWith('+'));
  const content = lines.join('\n');

  const matches = [...content.matchAll(eventPattern)];

  for (const match of matches) {
    const eventName = match[1];

    // Check if event name ends with past tense indicators
    const pastTenseEndings = ['ed', 'Created', 'Updated', 'Deleted', 'Activated', 'Deactivated', 'Registered', 'Confirmed'];
    const hasPastTense = pastTenseEndings.some(ending => eventName.includes(ending));

    if (!hasPastTense) {
      warnings.push(`Event name "${eventName}" may not follow past-tense convention`);
      suggestions.push(`Consider renaming to express a completed action (e.g., "${eventName}Created" or "${eventName}Updated")`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions
  };
}

function checkSliceStructure(changedFiles: string[]): ValidationResult {
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Group files by slice
  const sliceFiles = changedFiles.filter(f => f.includes('src/slices/'));

  const sliceMap = new Map<string, string[]>();

  for (const file of sliceFiles) {
    const match = file.match(/src\/slices\/([^/]+)\//);
    if (match) {
      const sliceName = match[1];
      if (!sliceMap.has(sliceName)) {
        sliceMap.set(sliceName, []);
      }
      sliceMap.get(sliceName)!.push(file);
    }
  }

  // Check if test files are included when logic changes
  for (const [sliceName, files] of sliceMap.entries()) {
    const hasLogicChange = files.some(f =>
      f.endsWith('Command.ts') ||
      f.endsWith('CommandHandler.ts') ||
      f.endsWith('Projection.ts') ||
      f.endsWith('processor.ts')
    );

    const hasTestChange = files.some(f => f.endsWith('.test.ts'));

    if (hasLogicChange && !hasTestChange) {
      warnings.push(`Logic changed in "${sliceName}" slice but no test file updated`);
      suggestions.push(`Consider updating ${sliceName}.test.ts to cover the changes`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
    suggestions
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

    console.log('🏗️  Event Model Validation:');

    // Validate event names
    const eventValidation = validateEventNames(data.staged_diff);

    // Check slice structure
    const structureValidation = checkSliceStructure(data.changed_files);

    const allWarnings = [...eventValidation.warnings, ...structureValidation.warnings];
    const allSuggestions = [...eventValidation.suggestions, ...structureValidation.suggestions];

    if (allWarnings.length === 0) {
      console.log('   ✅ Event model structure looks good');

      const result: AnalyzerResult = {
        approved: true,
        reason: 'Event model validation passed'
      };
      console.log('\n' + JSON.stringify(result));
      return;
    }

    if (allWarnings.length > 0) {
      console.log('\n   ⚠️  Validation warnings:');
      allWarnings.forEach(warning => console.log(`      - ${warning}`));
    }

    if (allSuggestions.length > 0) {
      console.log('\n   💡 Suggestions:');
      allSuggestions.forEach(suggestion => console.log(`      - ${suggestion}`));
    }

    // Approve but provide warnings
    const result: AnalyzerResult = {
      approved: true,
      reason: `Event model validation warnings (${allWarnings.length} warnings)`
    };

    console.log('\n' + JSON.stringify(result));

  } catch (error) {
    console.error('❌ Error in event model validator:', error);
    console.log(JSON.stringify({ approved: true, reason: 'analyzer_error' }));
    process.exit(1);
  }
}

main();
