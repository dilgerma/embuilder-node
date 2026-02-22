# Usage Guide

## Quick Start

### 1. Install Skills

```bash
# Just the skills
npx claude-eventmodel install

# Skills + template files for autonomous development
npx claude-eventmodel install --with-templates
```

### 2. Use Skills in Claude Code

Open Claude Code in your project and use:

```
/state-change-slice   # Generate command handlers
/state-view-slice     # Generate read models
/automation-slice     # Generate automations
```

## Two Development Modes

### Manual Mode (Interactive)

Use the skills directly in Claude Code sessions:

1. Describe what you want to build
2. Claude uses the appropriate skill
3. Code is generated
4. Tests run automatically

Example:
```
You: "I need to implement user registration with email verification"
Claude: [uses /state-change-slice to generate RegisterUser command]
Claude: [uses /automation-slice to generate email verification automation]
```

### Autonomous Mode (Ralph)

For continuous development with minimal human intervention:

1. Install with templates:
   ```bash
   npx claude-eventmodel install --with-templates
   ```

2. Define tasks in your event model or specifications

3. Run Ralph:
   ```bash
   ./ralph.sh 10  # Run up to 10 iterations
   ```

Ralph will:
- Read event models and specifications
- Use skills to generate code
- Run tests
- Track progress in `progress.txt`
- Update learnings in `AGENTS.md`
- Continue until all tasks complete

## File Overview

### Installed to `~/.claude/skills/eventmodel/`

- **automation-slice/** - Skill for background automations
- **state-change-slice/** - Skill for command handlers
- **state-view-slice/** - Skill for read models

### Template Files (Optional, with `--with-templates`)

Copied to your current directory:

- **ralph.sh** - Autonomous agent loop
  - Runs Claude in a loop
  - Handles retries and errors
  - Tracks progress

- **AGENTS.md** - Knowledge base
  - Patterns discovered during development
  - Common gotchas and solutions
  - Best practices for your project

- **Claude.md** - Project configuration
  - Technology stack settings
  - File organization rules
  - Coding standards

- **prompt.md** - Agent instructions
  - What Ralph should do each iteration
  - Quality requirements
  - Workflow steps

## Typical Workflow

### With Templates (Autonomous)

```bash
# 1. Set up
npx claude-eventmodel install --with-templates

# 2. Customize
edit Claude.md    # Add your project settings
edit prompt.md    # Define your workflow

# 3. Run autonomous development
./ralph.sh 20     # Run up to 20 iterations

# 4. Review
cat progress.txt  # See what was done
cat AGENTS.md     # See what was learned
```

### Without Templates (Manual)

```bash
# 1. Install skills
npx claude-eventmodel install

# 2. Use in Claude Code
claude
> /state-change-slice
> I need to implement order checkout
```

## Tips

- **Start with templates** if you want autonomous development
- **Start without templates** if you prefer manual/interactive development
- **Customize skills** by editing files in `~/.claude/skills/eventmodel/`
- **Track learnings** in AGENTS.md as patterns emerge
- **Use Ralph for repetitive tasks** (CRUD operations, similar features)
- **Use manual mode for complex features** that need design decisions

## Uninstalling

```bash
npx claude-eventmodel uninstall
```

This removes the skills from `~/.claude/skills/eventmodel/` but keeps template files in your project if you copied them.
