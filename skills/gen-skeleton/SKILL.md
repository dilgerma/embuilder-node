---
name: gen-skeleton
description: Generate a Supabase backend skeleton app
---

# Generate Skeleton App

Generate a new Supabase-based application skeleton with event modeling architecture.

## Task

You are tasked with generating a skeleton application using the emmet-supabase Yeoman generator.

## Steps

1. Check if a `config.json` file exists in the current directory
   - If not found, inform the user they need a config.json file
   - Ask if they want you to create a basic config.json template

2. Ask the user for the application name (or use default from config.json)

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