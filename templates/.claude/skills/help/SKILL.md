---
name: help
description: Step-by-step guide for getting started with event-driven development
---

# Event-Driven Development - Getting Started Guide

Welcome! This guide will walk you through the complete workflow from installation to running your first event-driven application.

## Overview

This framework helps you build event-sourced applications using event modeling. The workflow is:

1. Install the tooling (already done if you can run this skill!)
2. Model your domain in an event modeling tool (like Miro)
3. Export your model as config.json
4. Generate skeleton application
5. Use Ralph to auto-implement slices
6. Run your application

Let me guide you through each step:

---

## Step 1: Installation

If you're reading this, congratulations - the skills are already installed and working!

The following skills are now available:
- `/fetch-config` - Receive event model from modeling tool
- `/gen-skeleton` - Generate backend skeleton
- `/gen-state-change` - Generate command handlers
- `/gen-state-view` - Generate read models
- `/gen-automation` - Generate automation processors
- `/gen-ui` - Generate React UI with shadcn/ui
- `/help` - This guide

---

## Step 2: Create Your Event Model

You have two options:

### Option A: Use a Demo Config (Quickstart)

If you want to try the workflow without modeling, use our demo config:

```bash
cp .claude/skills/help/templates/demo-config.json config.json
```

This includes a simple shopping cart domain with:
- Commands: Add Item, Remove Item, Checkout Cart
- Events: Cart Created, Item Added, Item Removed, Cart Checked Out
- Read Models: Active Carts, Cart History

### Option B: Model Your Own Domain

1. **Use an Event Modeling Tool** (recommended: Miro, Mural, or similar)
   - Create your event model with commands, events, aggregates, and read models
   - Follow event modeling notation (orange=commands, blue=events, green=read models, yellow=aggregates)

2. **Export to config.json**
   - Most event modeling tools support JSON export
   - Alternatively, use our config receiver:

```bash
# Start the config receiver server
/fetch-config
```

This starts a server on http://localhost:3001 that waits for your event modeling tool to POST the config.

**Expected config.json structure:**
```json
{
  "slices": [
    {
      "id": "unique-id",
      "title": "Add Item",
      "sliceType": "STATE_CHANGE",
      "aggregate": "Cart",
      "command": { "name": "AddItem", "fields": [...] },
      "events": [{ "name": "ItemAdded", "fields": [...] }],
      "specifications": [...]
    }
  ]
}
```

---

## Step 3: Generate Skeleton Application

Once you have a `config.json` file, generate your application skeleton:

```bash
/gen-skeleton
```

You'll be prompted for:
- **Application name** - This becomes your project name (e.g., "my-shopping-cart")

This generates:
- Complete TypeScript backend with Express
- Supabase integration for authentication and database
- Event store setup
- Test infrastructure
- Development scripts

**What gets created:**
```
your-app/
├── src/
│   ├── common/         # Shared utilities (event store, DB, etc.)
│   ├── core/           # Core types and patterns
│   ├── slices/         # Your domain slices (generated next)
│   └── events/         # Event definitions
├── supabase/           # Database migrations
├── server.ts           # Express server
├── package.json        # Dependencies
└── .env               # Configuration
```

After generation:
```bash
npm install            # Install dependencies
npm run build          # Verify TypeScript compiles
```

---

## Step 4: Generate Your Slices

Now generate the actual business logic from your event model.

### Generate State Change Slices (Commands)

State change slices handle commands and emit events:

```bash
/gen-state-change
```

This will:
1. Read your config.json
2. Show available STATE_CHANGE slices
3. Let you select which ones to generate
4. Create command handlers with:
   - Business logic (decide/evolve pattern)
   - API endpoints
   - Tests
   - OpenAPI documentation

### Generate State View Slices (Read Models)

State view slices build queryable read models from events:

```bash
/gen-state-view
```

This creates:
- Event projections that build read models
- Query endpoints
- Database migrations
- Tests

### Generate Automation Slices (Background Jobs)

Automation slices run scheduled tasks:

```bash
/gen-automation
```

This creates:
- Cron-based processors
- Work queue handlers
- Automated command firing

---

## Step 5: Use Ralph to Auto-Implement Slices

**Ralph** is an AI agent that automatically implements your slices. Here's how:

### Mark Slices for Implementation

Edit `.slices/index.json` and change a slice's status to `"Planned"`:

```json
{
  "id": "...",
  "title": "Add Item",
  "status": "Planned",  // Change from "Created" to "Planned"
  "folder": "additem"
}
```

### Start Ralph Loop

```bash
./ralph.sh
```

Ralph will:
1. Find the highest priority slice with status "Planned"
2. Read the specification from `.slices/{folder}/.slice.json`
3. Implement the slice using event sourcing patterns
4. Write tests
5. Run tests and build to verify
6. Update status to "Done"
7. Repeat for next planned slice

**Ralph monitors:**
- `.slices/index.json` - Tracks which slices to implement
- `.slices/{folder}/.slice.json` - Detailed specifications
- `progress.txt` - Logs each iteration
- `AGENTS.md` - Learnings for future iterations

**Ralph runs until:**
- All "Planned" slices are "Done" (outputs `<promise>COMPLETE</promise>`)
- No "Planned" slices found (outputs `<promise>NO_TASKS</promise>`)
- Max iterations reached (default: 10)

You can watch Ralph work:
```bash
tail -f progress.txt    # Watch progress in real-time
```

---

## Step 6: Run Your Application

Once slices are implemented, start your app:

```bash
npm run dev
```

Your application starts on http://localhost:3000 with:
- API endpoints at `/api/*`
- Swagger documentation at `/api-docs`
- Authentication via Supabase
- Event store in PostgreSQL

### Test Your API

```bash
# Health check
curl http://localhost:3000/api/health

# Call a command (requires auth)
curl -X POST http://localhost:3000/api/add-item \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"cartId": "cart-123", "itemId": "item-456"}'

# Query a read model
curl http://localhost:3000/api/carts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Common Workflows

### Iterate on Your Model

1. Update your event model
2. Re-export config.json (or restart `/fetch-config`)
3. Regenerate slices: `/gen-state-change` or `/gen-state-view`
4. Mark slices as "Planned" in `.slices/index.json`
5. Run Ralph: `./ralph.sh`

### Add a New Slice

1. Add slice to config.json
2. Regenerate: `/gen-state-change` or `/gen-state-view`
3. Mark as "Planned" in `.slices/index.json`
4. Run Ralph: `./ralph.sh`

### Implement Manually (without Ralph)

You can always implement slices manually:

1. Read the spec in `.slices/{folder}/.slice.json`
2. Follow patterns in `CLAUDE.md` and `AGENTS.md`
3. Implement in `src/slices/{folder}/`
4. Write tests in `src/slices/{folder}/*.test.ts`
5. Run `npm run build && npm test`
6. Update status to "Done" in `.slices/index.json`

### Generate UI

After backend slices are done:

```bash
/gen-ui
```

This creates a React frontend with:
- shadcn/ui components
- Supabase authentication
- Type-safe API client
- Tailwind CSS styling

---

## Architecture Patterns

### Event Sourcing

Commands don't directly mutate state. Instead:

1. **Command** arrives (e.g., "Add Item")
2. **decide()** function validates and returns events
3. **Events** are stored in event store (immutable facts)
4. **evolve()** function rebuilds state from events
5. **Projections** build read models from event stream

### Slice Structure

Each slice is self-contained:

```
src/slices/AddItem/
├── AddItemCommand.ts      # decide() + evolve() logic
├── AddItem.test.ts        # Given/when/then tests
├── routes.ts              # HTTP endpoint
└── .slice.json            # Specification
```

### Testing Pattern

Tests use given/when/then:

```typescript
given([CartCreated, ItemAdded])  // Precondition events
  .when(AddItem)                  // Command to test
  .then([ItemAdded])              // Expected events
```

---

## Troubleshooting

### "config.json not found"

Run `/fetch-config` to start the receiver, or create one manually.

### "No slices with status Planned"

Edit `.slices/index.json` and change a slice's status to `"Planned"`.

### "Tests failing"

Check `progress.txt` for Ralph's latest attempt. Review test output:
```bash
npm test
```

### "Build errors"

```bash
npm run build
# Fix TypeScript errors shown
```

### "Ralph keeps saying NO_TASKS"

Ralph only works on slices with status "Planned" (case insensitive).
Check `.slices/index.json` and ensure at least one slice has:
```json
"status": "Planned"
```

---

## Next Steps

Now you're ready to build event-driven applications! Here are some resources:

- **Event Modeling**: Learn more at https://eventmodeling.org
- **Event Sourcing**: See @event-driven-io/emmett docs
- **Supabase**: Authentication and database - https://supabase.com/docs
- **Project Instructions**: Read `CLAUDE.md` for project-specific guidelines
- **Agent Learnings**: Check `AGENTS.md` for implementation patterns

## Need Help?

Ask me anything about:
- Event modeling concepts
- Slice implementation details
- Testing strategies
- Architecture decisions
- Troubleshooting specific errors

Happy event-driven development!
