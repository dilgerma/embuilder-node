---
name: gen-state-change
description: Generate state change slices from config.json
---

# Generate State Change Slice

Generate state change slices (command handlers) from your event model configuration.

## Task

You are tasked with generating one or more state change slices using the emmet-supabase Yeoman generator.

## Steps

1. Check if a `config.json` file exists in the current directory
   - If not found, inform the user they need a config.json file
   - Exit with instructions on creating one

2. Read the config.json to find available STATE_CHANGE slices:
   - Look for slices with `"sliceType": "STATE_CHANGE"`
   - Extract their IDs and titles

3. Show the user available state change slices and ask which ones to generate
   - Allow multiple selections
   - Or accept slice IDs from the user's original request

4. Run the local generator with selected slices:
   ```bash
   npx yo ./.claude/skills/gen-skeleton/generators/emmet-supabase/app --action STATE_CHANGE --slices <slice-id-1>,<slice-id-2>
   ```

5. After generation completes:
   - List the files that were created
   - Run tests for the generated slices if available
   - Suggest next steps

## Important Notes

- The generator is located in `.claude/skills/gen-skeleton/generators/emmet-supabase`
- Multiple slices can be generated in one command (comma-separated)
- Slice IDs must exactly match those in config.json
- Generated files typically include:
  - CommandHandler.ts (business logic)
  - routes.ts (HTTP endpoints)
  - Tests