---
skill_name: ui-build-slice-ui
description: Orchestrate the complete process of building a UI from slice definitions by coordinating all other frontend skills
version: 1.0.0
author: Frontend Development Team
tags: [ui, orchestrator, slices, automation, full-stack]
---

# Full Slice Builder Skill (Orchestrator)

Orchestrate the complete process of building a UI from slice definitions by coordinating all other frontend skills.

## Instructions

You will be provided with:
- Group ID or slice JSON file paths
- Domain/entity name (optional, can be inferred)

Your task is to execute the full workflow to generate a complete, working UI implementation:

## Workflow Steps

### 1. Analyze Slices
Use the **ui-analyze-slices** skill to:
- Identify all slices in the group
- Determine slice types (STATE_VIEW, STATE_CHANGE)
- Find grouping and dependencies
- Create implementation plan

### 2. Read UI Prompts
Use the **ui-read-ui-prompts** skill to:
- Extract UI requirements from `ui-prompt.md`
- Parse `codeGen.uiPrompts`
- Understand design, validation, and UX flow requirements

### 3. Generate Types
Use the **ui-generate-types** skill to:
- Create TypeScript interfaces for entities
- Create parameter interfaces for commands
- Add types to `src/types/index.ts`

### 4. Generate API Functions
Use the **ui-generate-api** skill to:
- Create Supabase query functions for STATE_VIEW slices
- Create command POST functions for STATE_CHANGE slices
- Add functions to `src/lib/api.ts`
- Update `src/lib/api-client.ts` with command endpoints

### 5. Generate Hooks
Use the **ui-generate-hook** skill to:
- Create query hooks for STATE_VIEW slices
- Create mutation hooks for STATE_CHANGE slices
- Add hooks to `src/hooks/api/`
- Update `src/hooks/api/index.ts` with exports

### 6. Scaffold Components
Use the **ui-scaffold-component** skill to:
- Create list components for STATE_VIEW slices
- Create dialog components for STATE_CHANGE slices
- Create page component to compose list and dialogs
- Add components to `src/components/{domain}/`
- Apply UI prompt requirements (Bulma CSS, validation, formatting)

### 7. Verify Integration
- Check that all imports are correct
- Verify types are properly exported and imported
- Ensure hooks are properly exported
- Confirm components import hooks and types correctly

## Execution Order

```
1. ui-analyze-slices
   ↓
2. ui-read-ui-prompts
   ↓
3. ui-generate-types
   ↓
4. ui-generate-api
   ↓
5. ui-generate-hook
   ↓
6. ui-scaffold-component
   ↓
7. Integration verification
```

## Output Format

Provide a comprehensive summary:

```
# Slice UI Build Complete

## Group: {groupId}
Domain: {domain}

## Summary

✓ Analyzed {count} slices
✓ Generated types for {entities}
✓ Created {count} API functions
✓ Created {count} hooks
✓ Scaffolded {count} components

## Files Created/Modified

### Types (src/types/index.ts)
- {Entity} interface
- {Action}{Entity}Params interface

### API Functions (src/lib/api.ts)
- fetch{Entity}()
- {action}{Entity}()

### API Client (src/lib/api-client.ts)
- {COMMAND_ENDPOINT} added

### Hooks (src/hooks/api/)
- use{Entity}.ts
- use{Action}{Entity}.ts
- Updated index.ts with exports

### Components (src/components/{domain}/)
- {Entity}List.tsx
- {Action}{Entity}Dialog.tsx
- {Entity}Page.tsx

## Next Steps

1. Add route to router configuration:
   ```typescript
   import { {Entity}Page } from '@/components/{domain}/{Entity}Page';

   // In routes:
   { path: '/{entities}', element: <{Entity}Page /> }
   ```

2. Test the implementation:
   ```bash
   npm run dev
   ```

3. Navigate to `/{entities}` to see the UI

## Implementation Notes

- {any special notes from UI prompts}
- {any validation rules applied}
- {any custom formatting implemented}
```

## Error Handling

If any step fails:
1. Report which step failed
2. Provide the error details
3. Suggest fixes or next steps
4. Do not proceed to dependent steps

## Validation Checklist

Before completing, verify:

- [ ] All TypeScript types are properly defined
- [ ] API functions handle errors appropriately
- [ ] Hooks are properly exported from index.ts
- [ ] Components import all necessary dependencies
- [ ] Bulma CSS classes are used correctly
- [ ] Form validation matches UI prompt requirements
- [ ] Date/time formatting matches specifications
- [ ] Loading and error states are handled
- [ ] Success/error feedback is implemented
- [ ] Responsive design is applied (Bulma columns)
- [ ] All files follow project conventions

## Integration with Existing Code

When modifying existing files:

1. **src/types/index.ts**:
   - Add new interfaces at the end
   - Maintain alphabetical ordering if followed
   - Check for duplicate type names

2. **src/lib/api.ts**:
   - Add functions in relevant sections (queries/commands)
   - Follow existing error handling patterns
   - Import necessary types

3. **src/lib/api-client.ts**:
   - Add command endpoints to the `commandEndpoints` object
   - Follow existing naming convention (UPPER_SNAKE_CASE)

4. **src/hooks/api/index.ts**:
   - Add exports in alphabetical order if followed
   - Use named exports consistently

## Best Practices

- Generate minimal, focused code (avoid over-engineering)
- Follow existing project patterns and conventions
- Use Bulma CSS exclusively (no custom CSS unless necessary)
- Include JSDoc comments for public APIs
- Handle edge cases (empty lists, errors, loading)
- Implement proper TypeScript types (no `any`)
- Follow React best practices (hooks rules, controlled components)
- Ensure accessibility (semantic HTML, ARIA when needed)

## Example Usage

```bash
# Build UI for all slices in the events group
/build-slice-ui --group "event-management-group"

# Build UI from specific slice files
/build-slice-ui src/slices/events/ViewEvents.json src/slices/events/CreateEvent.json
```

## Notes

- This skill orchestrates all other skills in sequence
- Each step depends on the previous step's output
- If UI prompts provide specific requirements, prioritize them over defaults
- Always use Bulma CSS components and utilities
- Generate clean, maintainable, production-ready code
- Follow TypeScript strict mode requirements
- Test the generated code before marking as complete
