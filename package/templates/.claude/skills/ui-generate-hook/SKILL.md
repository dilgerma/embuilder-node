---
skill_name: ui-generate-hook
description: Generate React Query hooks from slice definitions for STATE_VIEW (queries) and STATE_CHANGE (mutations)
version: 1.0.0
author: Frontend Development Team
tags: [ui, react-query, hooks, queries, mutations]
---

# Hook Generator Skill

Generate React Query hooks from slice definitions for STATE_VIEW (queries) and STATE_CHANGE (mutations).

## Instructions

You will be provided with:
- Slice JSON file path
- Slice type (STATE_VIEW or STATE_CHANGE)
- Entity name

Your task is to:

1. **Read the slice JSON file** to understand:
   - Fields and their types
   - Read model table name (for STATE_VIEW)
   - Command endpoint (for STATE_CHANGE)
   - Required vs optional fields

2. **Generate the appropriate hook file** in `src/hooks/api/`:
   - For STATE_VIEW: Create `use{Entity}.ts` with a query hook
   - For STATE_CHANGE: Create `use{Action}{Entity}.ts` with a mutation hook

3. **Follow React Query patterns**:
   - STATE_VIEW hooks use `useQuery`
   - STATE_CHANGE hooks use `useMutation`
   - Include proper TypeScript types
   - Add JSDoc comments

4. **Generate hook exports** for `src/hooks/api/index.ts`

## Hook Structure

### For STATE_VIEW (Query Hook)

```typescript
import { useQuery } from '@tanstack/react-query';
import { fetch{Entity} } from '@/lib/api';
import type { {Entity} } from '@/types';

/**
 * Hook to fetch {entity} data
 */
export function use{Entity}() {
  return useQuery<{Entity}[]>({
    queryKey: ['{entity}'],
    queryFn: fetch{Entity},
  });
}
```

### For STATE_CHANGE (Mutation Hook)

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { {actionCamelCase}{Entity} } from '@/lib/api';
import type { {Action}{Entity}Params } from '@/types';

/**
 * Hook to {action description} {entity}
 */
export function use{Action}{Entity}() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({actionCamelCase}{Entity}),
    onSuccess: () => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['{relatedEntity}'] });
    },
  });
}
```

## Output Format

Provide:

1. **Hook file path and content**
2. **Export statement** to add to `src/hooks/api/index.ts`
3. **API function signature** that needs to be created in `src/lib/api.ts`

Example:

```
# Hook Generated

## File: src/hooks/api/useEvents.ts

[Hook content here]

## Export for src/hooks/api/index.ts

export { useEvents } from './useEvents';

## Required API Function in src/lib/api.ts

export async function fetchEvents(): Promise<Event[]> {
  // Implementation needed
}
```

## Notes

- Always check if the hook file already exists before creating
- For mutations, determine which queries should be invalidated based on the entity and action
- Use proper naming conventions: `useEntityName` for queries, `useActionEntity` for mutations
- Include error handling patterns
- For create/update actions, typically invalidate the list query
- For delete actions, invalidate both list and detail queries if applicable
