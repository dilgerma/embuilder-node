---
name: gen-automation
description: Generate automation slices from config.json
---

# Generate Automation Slice

Generate automation slices (background processors with CRON scheduling) from your event model configuration.

## Task

You are tasked with generating one or more automation slices using the emmet-supabase Yeoman generator.

## Steps

1. Check if a `config.json` file exists in the current directory
   - If not found, inform the user they need a config.json file
   - Exit with instructions on creating one

2. Read the config.json to find available AUTOMATION slices:
   - Look for slices with `"sliceType": "AUTOMATION"`
   - Extract their IDs and titles

3. Show the user available automation slices and ask which ones to generate
   - Allow multiple selections
   - Or accept slice IDs from the user's original request

4. Run the generator with selected slices:
   ```bash
   npx yo emmet-supabase --action AUTOMATION --slices <slice-id-1>,<slice-id-2>
   ```

5. After generation completes:
   - List the files that were created
   - Run tests for the generated slices if available
   - Explain the CRON configuration if applicable
   - Suggest next steps

## Important Notes

- Multiple slices can be generated in one command (comma-separated)
- Slice IDs must exactly match those in config.json
- Generated files typically include:
  - processor.ts (background automation logic)
  - CRON configuration
  - Tests
- Automation slices read from TODO lists (work queues) and fire commands on a schedule
- Common use cases: auto-confirm invitations, process checkouts, send notifications