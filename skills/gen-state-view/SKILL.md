---
name: gen-state-view
description: Generate state view slices from config.json
---

# Generate State View Slice

Generate state view slices (read models/projections) from your event model configuration.

## Task

You are tasked with generating one or more state view slices using the emmet-supabase Yeoman generator.

## Steps

1. Check if a `config.json` file exists in the current directory
   - If not found, inform the user they need a config.json file
   - Exit with instructions on creating one

2. Read the config.json to find available STATE_VIEW slices:
   - Look for slices with `"sliceType": "STATE_VIEW"`
   - Extract their IDs and titles

3. Show the user available state view slices and ask which ones to generate
   - Allow multiple selections
   - Or accept slice IDs from the user's original request

4. Run the generator with selected slices:
   ```bash
   npx yo emmet-supabase --action STATE_VIEW --slices <slice-id-1>,<slice-id-2>
   ```

5. After generation completes:
   - List the files that were created
   - Run tests for the generated slices if available
   - Suggest next steps

## Important Notes

- Multiple slices can be generated in one command (comma-separated)
- Slice IDs must exactly match those in config.json
- Generated files typically include:
  - Projection.ts (event subscribers and view builders)
  - routes.ts (query endpoints)
  - Tests
- State view slices build queryable read models from events