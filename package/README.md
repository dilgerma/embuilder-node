# EMBuilder

Event-Model driven development toolkit for Claude Code. Generate code slices from event model specifications using simple slash commands.

## Installation

Super simple - install from GitHub Packages:

```bash
npx @dilgerma/embuilder install
```

That's it! The skills are now available in Claude Code.

### Manual Installation (Alternative)

If you want to install from a local directory:

```bash
cd /path/to/embuilder
npm install
npm run build
npm link
embuilder install
```

## What This Does

This package adds powerful skills to Claude Code for event-model driven development:

### Event Model Skills
- `/automation-slice` - Generate automation slices (background processes with CRON)
- `/state-change-slice` - Generate command handlers (business logic)
- `/state-view-slice` - Generate read models/projections (queries and views)

### Configuration Skills
- `/fetch-config` - Fetch config.json from your event model app (localhost:3001)

### Yeoman Generator Skills
- `/gen-skeleton` - Generate a Supabase backend skeleton app
- `/gen-state-change` - Generate state change slices from config.json
- `/gen-state-view` - Generate state view slices from config.json
- `/gen-automation` - Generate automation slices from config.json
- `/gen-ui` - Set up a React UI project with shadcn/ui and Supabase

All based on your event model specifications and configuration!

## Quick Start

### From GitHub Packages

```bash
npx @dilgerma/embuilder install
```

### From Local Directory

```bash
./install.sh
```

### Using the Skills

In Claude Code, just type one of these commands:

**Event Model Skills:**
```
/state-change-slice   # Generate a command handler
/state-view-slice     # Generate a read model
/automation-slice     # Generate a background automation
```

**Configuration:**
```
/fetch-config         # Fetch config from event model app
```

**Yeoman Generator Skills:**
```
/gen-skeleton         # Generate Supabase backend skeleton
/gen-state-change     # Generate state change slices from config
/gen-state-view       # Generate state view slices from config
/gen-automation       # Generate automation slices from config
/gen-ui               # Set up React UI project
```

Claude will:
- Guide you through the generation process
- Find your event model or config.json
- Generate TypeScript code following best practices
- Create tests automatically
- Run the tests to verify everything works

## Skills Overview

### Event Model Skills

#### `/automation-slice`
Builds background automations that:
- Read from TODO lists (work queues)
- Fire commands on a CRON schedule
- Process items automatically

**Use case:** Auto-confirm invitations, process checkouts, send notifications

#### `/state-change-slice`
Builds command handlers that:
- Accept commands (user actions)
- Validate against current state
- Emit events (facts about what happened)

**Use case:** Register clerk, activate feature, submit timesheet

#### `/state-view-slice`
Builds read models that:
- Subscribe to events
- Build queryable views
- Support UI and reporting

**Use case:** Active shifts dashboard, clerk directory, event calendar

### Yeoman Generator Skills

#### `/gen-skeleton`
Generates a complete Supabase backend skeleton app:
- Event store setup
- Basic project structure
- Common utilities and helpers
- Supabase configuration

**Use case:** Bootstrap a new event-sourced application

#### `/gen-state-change`, `/gen-state-view`, `/gen-automation`
Generate slices from your `config.json` file:
- Reads slice definitions from config
- Generates complete TypeScript implementations
- Creates API routes and tests
- Works with Yeoman's template system

**Use case:** Generate code from pre-defined slice configurations

#### `/gen-ui`
Sets up a modern React UI project:
- Vite + React + TypeScript
- shadcn/ui component library (Radix UI + Tailwind)
- Supabase client integration
- React Router and React Query
- Full suite of pre-built UI components

**Use case:** Quickly scaffold a frontend for your Supabase backend

## Event Model Structure

Your event model (JSON) typically defines:

```json
{
  "commands": [
    {
      "title": "Register Clerk",
      "fields": [
        {"name": "clerkId", "type": "UUID"},
        {"name": "name", "type": "String"}
      ]
    }
  ],
  "events": [
    {
      "title": "Clerk Registered",
      "fields": [...]
    }
  ],
  "processors": [...],
  "readmodels": [...]
}
```

## Generated Code Structure

```
src/slices/{slice-name}/
├── CommandHandler.ts    # Business logic (state-change)
├── Projection.ts        # Read model (state-view)
├── processor.ts         # CRON automation (automation)
├── routes.ts            # HTTP API endpoints
├── {SliceName}.test.ts  # Automated tests
└── ui/                  # UI components (optional)
```

## Commands

```bash
# Install skills only
npx @dilgerma/embuilder install

# Install skills + template files (ralph.sh, AGENTS.md, Claude.md, prompt.md)
npx @dilgerma/embuilder install --with-templates

# Uninstall
npx @dilgerma/embuilder uninstall

# Check status
npx @dilgerma/embuilder status
```

### Template Files

When you use `--with-templates`, you get:

- **`ralph.sh`** - Autonomous agent loop for continuous development
- **`AGENTS.md`** - Track learnings and patterns from development
- **`Claude.md`** - Project-specific configuration for Claude Code
- **`prompt.md`** - Agent instructions for automated development
- **`.claude/hooks/`** - Pre-commit hooks that analyze git diffs before commits
  - Includes built-in analyzers for code quality and event model validation
  - Extensible with custom TypeScript analyzers

These files enable the full event-model driven development workflow with autonomous agents.

### Git Commit Hooks

The template includes a pre-commit hook system that automatically analyzes changes before commits:

**Built-in Analyzers:**
- **Code Quality Checker** - Detects console.log, debugger statements, TODOs, and potential secrets
- **Event Model Validator** - Ensures event naming conventions and slice structure
- **Logger** - Displays commit statistics and changed files

**Features:**
- Written in TypeScript for type safety
- Extensible - add your own analyzers
- Non-blocking by default
- Integrates seamlessly with Claude Code

See `.claude/hooks/README.md` for full documentation on creating custom analyzers.

## Philosophy

This toolkit follows **event-model driven development**:

1. **Design first** - Define your event model (events, commands, aggregates)
2. **Generate code** - Use Claude skills to generate implementation
3. **Test automatically** - Generated code includes tests
4. **Iterate quickly** - Change the model, regenerate

## Requirements

- Node.js 18+
- Claude Code CLI
- TypeScript knowledge (for understanding generated code)

## License

MIT
