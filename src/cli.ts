#!/usr/bin/env node

import { Command } from 'commander';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, copyFileSync, chmodSync, cpSync, rmSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const program = new Command();

const SKILLS_DIR = join(process.cwd(), '.claude', 'skills');

program
  .name('embuilder')
  .description('EMBuilder - Event-Model driven development toolkit for Claude Code')
  .version('0.1.7');

program
  .command('install')
  .description('Install event-model skills into Claude Code')
  .option('--with-templates', 'Also copy template files (ralph.sh, AGENTS.md, Claude.md, prompt.md, README.md) and generators to current directory')
  .action((options) => {
    console.log('📦 Installing EMBuilder skills...\n');

    // Ensure .claude/skills directory exists
    const baseSkillsDir = dirname(SKILLS_DIR);
    if (!existsSync(baseSkillsDir)) {
      mkdirSync(baseSkillsDir, { recursive: true });
    }

    // Get the skills directory from the package
    const skillsSource = join(__dirname, '..', 'skills');

    // Remove existing directory if it exists
    if (existsSync(SKILLS_DIR)) {
      console.log('  Removing existing installation...');
      rmSync(SKILLS_DIR, { recursive: true, force: true });
    }

    // Copy skills directory
    try {
      cpSync(skillsSource, SKILLS_DIR, { recursive: true });
      console.log(`✅ Skills copied to: ${SKILLS_DIR}`);
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

      // Copy template files if requested
      if (options.withTemplates) {
        console.log('\n📄 Copying template files to current directory...');
        const templatesSource = join(__dirname, '..', 'templates');
        const targetDir = process.cwd();

        const files = ['ralph.sh', 'AGENTS.md', 'Claude.md', 'prompt.md', 'README.md'];
        files.forEach(file => {
          const source = join(templatesSource, file);
          const target = join(targetDir, file);

          if (existsSync(source)) {
            copyFileSync(source, target);
            console.log(`  ✓ ${file}`);

            // Make ralph.sh executable
            if (file === 'ralph.sh') {
              chmodSync(target, 0o755);
            }
          }
        });

        // Copy generators directory
        console.log('\n📦 Copying generators to current directory...');
        const generatorsSource = join(__dirname, '..', 'generators');
        const generatorsTarget = join(targetDir, 'generators');

        if (existsSync(generatorsSource)) {
          cpSync(generatorsSource, generatorsTarget, { recursive: true });
          console.log('  ✓ generators/');
        }

        console.log('\n📝 Template files copied! You can now:');
        console.log('  - Read README.md for detailed usage instructions');
        console.log('  - Edit Claude.md with project-specific settings');
        console.log('  - Run ./ralph.sh for automated development loops');
        console.log('  - Track learnings in AGENTS.md');
        console.log('  - Use generators/ for Yeoman-based code generation');
      } else {
        console.log('\n💡 Tip: Run with --with-templates to copy template files, README.md, and generators');
      }

      console.log('\n🎉 Installation complete!');
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