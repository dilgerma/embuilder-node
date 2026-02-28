---
name: skeleton-ui
description: Set up React UI with shadcn/ui and Supabase
---

# Generate Supabase UI Project

Generate a new React UI project with Vite, TypeScript, shadcn/ui, and Supabase integration.

## Task

You are tasked with setting up a modern React UI project using the emmet-supabase-ui template.

## Steps

1. Ask the user for the target directory name for the UI project
   - Suggest a default like "ui" or "frontend"
   - Check if the directory already exists

2. Copy the local template to the target directory:
   ```bash
   cp -r .claude/skills/gen-ui/generators/emmet-supabase-ui <target-directory>
   ```

3. Navigate to the new directory and install dependencies:
   ```bash
   cd <target-directory> && npm install
   ```

4. After setup completes, inform the user about:
   - The project structure
   - Available npm scripts:
     - `npm run dev` - Start development server
     - `npm run build` - Build for production
     - `npm test` - Run tests
     - `npm run lint` - Lint code
   - Next steps:
     - Configure Supabase connection in `.env.development`
     - Start the dev server
     - Explore the shadcn/ui components in `src/components/ui/`

## Important Notes

- The template includes:
  - React 18 with TypeScript
  - Vite for fast development
  - shadcn/ui component library (Radix UI + Tailwind CSS)
  - Supabase client integration
  - React Router for routing
  - React Query for data fetching
  - Full suite of pre-configured UI components
- The `.env.development` file needs Supabase credentials
- Template is located at `.claude/skills/gen-ui/generators/emmet-supabase-ui/`