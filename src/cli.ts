#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, chmodSync, cpSync, rmSync, readdirSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

const SKILLS_DIR = join(process.cwd(), '.claude', 'skills');

program
  .name('embuilder')
  .description('EMBuilder - Event-Model driven development toolkit for Claude Code')
  .version('0.1.22');

program
  .command('install')
  .description('Install event-model skills into Claude Code')
  .option('--with-templates', 'Also copy template files (ralph.sh, AGENTS.md, Claude.md, prompt.md, README.md) and generators to current directory')
  .action((options) => {
    console.log('📦 Installing EMBuilder...\n');

    try {
      // Copy template files if requested
      if (options.withTemplates) {
        console.log('\n📄 Copying all templates to current directory...');
        const templatesSource = join(__dirname, '..', 'templates');
        const targetDir = process.cwd();

        if (!existsSync(templatesSource)) {
          console.error('❌ Templates directory not found!');
          console.error(`   Expected location: ${templatesSource}`);
          console.error(`   Package location: ${__dirname}`);
          console.error('');
          console.error('This might be caused by:');
          console.error('  1. Old cached version - try: npx --yes @dilgerma/embuilder@latest install --with-templates');
          console.error('  2. Package not published correctly - reinstall with: npm install -g @dilgerma/embuilder@latest');
          console.error('');
          console.error('If the problem persists, please report at:');
          console.error('  https://github.com/dilgerma/embuilder/issues');
          process.exit(1);
        }

        // Copy everything from templates/ to current directory
        try {
          // Read all items in templates directory and copy each one
          // We copy items individually instead of the entire directory to have better control
          const items = readdirSync(templatesSource);

          for (const item of items) {
            const sourcePath = join(templatesSource, item);
            const targetPath = join(targetDir, item);

            // Skip node_modules if present
            if (item === 'node_modules') {
              continue;
            }

            try {
              const stat = statSync(sourcePath);

              if (stat.isDirectory()) {
                // For directories, copy with filter to skip node_modules
                cpSync(sourcePath, targetPath, {
                  recursive: true,
                  filter: (source) => {
                    // Get the relative path from the source directory to avoid matching
                    // 'node_modules' in the npx cache path itself
                    const relativePath = source.replace(sourcePath, '');
                    return !relativePath.includes('node_modules');
                  }
                });
              } else {
                // For files, copy directly
                cpSync(sourcePath, targetPath);
              }
            } catch (itemError: any) {
              console.error(`  ❌ Error copying ${item}:`, itemError?.message);
            }

            // Verify this item was copied
            if (!existsSync(targetPath)) {
              console.error(`  ❌ Failed to copy: ${item}`);
            }
          }
        } catch (copyError: any) {
          console.error('  ❌ Error during copy:', copyError);
          throw copyError;
        }

        // Verify files were actually copied
        const copiedFiles = existsSync(join(targetDir, 'README.md'));

        // Make ralph.sh executable if it exists
        const ralphPath = join(targetDir, 'ralph.sh');
        if (existsSync(ralphPath)) {
          chmodSync(ralphPath, 0o755);
          console.log('  ✓ Made ralph.sh executable');
        }

        if (!copiedFiles) {
          console.error('  ❌ Files were not copied! This is a bug.');
          console.error('  Please report this at: https://github.com/dilgerma/embuilder/issues');
          process.exit(1);
        }

        console.log('  ✓ All template files and directories copied');
        console.log('    - README.md, Claude.md, AGENTS.md, prompt.md, ralph.sh');
        console.log('    - .claude/ directory with skills and generators');
        console.log('    - All other template contents');

        console.log('\n📝 Templates copied! You can now:');
        console.log('  - Read README.md for detailed usage instructions');
        console.log('  - Edit Claude.md with project-specific settings');
        console.log('  - Run ./ralph.sh for automated development loops');
        console.log('  - Track learnings in AGENTS.md');
        console.log('  - Use skills in .claude/skills/ for code generation');

        console.log('\n✅ Installation complete with templates!');
      } else {
        // Just copy skills without templates
        console.log('📄 Installing skills only...');

        // Ensure .claude/skills directory exists
        const baseSkillsDir = dirname(SKILLS_DIR);
        if (!existsSync(baseSkillsDir)) {
          mkdirSync(baseSkillsDir, { recursive: true });
        }

        // Get the skills directory from templates
        const skillsSource = join(__dirname, '..', 'templates', '.claude', 'skills');

        // Remove existing directory if it exists
        if (existsSync(SKILLS_DIR)) {
          console.log('  Removing existing installation...');
          rmSync(SKILLS_DIR, { recursive: true, force: true });
        }

        // Copy skills directory from templates
        if (existsSync(skillsSource)) {
          cpSync(skillsSource, SKILLS_DIR, { recursive: true });
          console.log(`✅ Skills copied to: ${SKILLS_DIR}`);
        } else {
          throw new Error(`Skills directory not found at: ${skillsSource}`);
        }

        console.log('\nAvailable commands:');
        console.log('\n  Event Model Slices:');
        console.log('  /automation-slice   - Generate automation slice from event model');
        console.log('  /state-change-slice - Generate state-change slice from event model');
        console.log('  /state-view-slice   - Generate state-view slice from event model');
        console.log('\n  Configuration:');
        console.log('  /fetch-config       - Fetch config.json from event model app');
        console.log('\n  Yeoman Generators:');
        console.log('  /gen-skeleton       - Generate Supabase backend skeleton app');
        console.log('  /gen-state-change   - Generate state change slices from config.json');
        console.log('  /gen-state-view     - Generate state view slices from config.json');
        console.log('  /gen-automation     - Generate automation slices from config.json');
        console.log('  /gen-ui             - Set up React UI with shadcn/ui and Supabase');

        console.log('\n💡 Tip: Run with --with-templates to copy all template files including .claude directory');
        console.log('\n✅ Installation complete!');
      }
    } catch (error) {
      console.error('❌ Installation failed:', error);
      process.exit(1);
    }
  });

program
  .command('uninstall')
  .description('Remove event-model skills from Claude Code')
  .action(() => {
    if (existsSync(SKILLS_DIR)) {
      rmSync(SKILLS_DIR, { recursive: true, force: true });
      console.log('✅ EMBuilder skills uninstalled');
    } else {
      console.log('ℹ️  Skills not currently installed');
    }
  });

program
  .command('status')
  .description('Check installation status')
  .action(() => {
    console.log('EMBuilder Skills Status\n');
    console.log(`Installation path: ${SKILLS_DIR}`);
    console.log(`Installed: ${existsSync(SKILLS_DIR) ? '✅ Yes' : '❌ No'}`);

    if (existsSync(SKILLS_DIR)) {
      const skillsSource = join(__dirname, '..', 'skills');
      console.log(`Source: ${skillsSource}`);
    }
  });

program.parse();