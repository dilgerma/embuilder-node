---
name: gen-skeleton
description: Generate a Supabase backend skeleton app
---

# Generate Skeleton App

Generate a new Supabase-based application skeleton with event modeling architecture.

## Task

You are tasked with generating a skeleton application using the emmet-supabase Yeoman generator.

## Steps

1. don´t read the config.json file

2. Ask the user for the application name

3. Run the generator:
   ```bash
   npx yo emmet-supabase --action skeleton --app-name <app-name>
   ```

4. After generation completes:
   - Inform the user what was created
   - Suggest next steps (e.g., installing dependencies, reviewing the structure)

## Important Notes

- The generator requires Yeoman, but npx will handle installation automatically
- The config.json file should exist in the current directory
- Use non-interactive mode with command-line flags for automation