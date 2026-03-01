# Help Skill

A comprehensive step-by-step guide for getting started with event-driven development using this framework.

## Usage

```bash
/help
```

This will display the full getting started guide covering:

1. **Installation** - Verify tooling is set up
2. **Event Modeling** - Create your domain model (or use demo config)
3. **Generate Skeleton** - Scaffold your application
4. **Generate Slices** - Create commands, read models, and automations
5. **Ralph Loop** - Auto-implement slices with AI
6. **Run Application** - Start your event-sourced app

## Demo Config

A pre-built shopping cart demo is included for quick testing:

```bash
cp .claude/skills/help/templates/demo-config.json config.json
```

The demo includes:
- **3 State Change Slices**: Add Item, Remove Item, Checkout Cart
- **2 State View Slices**: Active Carts, Cart History
- **1 Automation Slice**: Abandoned Cart Reminder

## Files

```
.claude/skills/help/
├── SKILL.md                        # Main help content
├── README.md                       # This file
└── templates/
    └── demo-config.json           # Shopping cart demo
```

## What the Help Skill Covers

### For Beginners
- What is event-driven development
- Event modeling basics
- Step-by-step workflow
- Common patterns and architecture

### For Implementation
- How to use each generator skill
- Ralph agent workflow
- Slice structure and patterns
- Testing strategies

### For Troubleshooting
- Common issues and solutions
- How to debug Ralph
- Build and test errors
- Configuration problems

## Related Skills

- `/fetch-config` - Receive event model from modeling tool
- `/gen-skeleton` - Generate backend skeleton
- `/gen-state-change` - Generate command handlers
- `/gen-state-view` - Generate read models
- `/gen-automation` - Generate automation processors
- `/gen-ui` - Generate React UI

## Developer Notes

The help skill is designed to be:
- **Progressive** - Start simple, add detail as needed
- **Actionable** - Every section has clear commands to run
- **Self-contained** - Can be read without external docs
- **Searchable** - Clear headings for jumping to topics

When updating, consider:
- Keep code examples up to date with generator output
- Update troubleshooting based on common user issues
- Add new sections for new features
- Test demo config works with current generators
