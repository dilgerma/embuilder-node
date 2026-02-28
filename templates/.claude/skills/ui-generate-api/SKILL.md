---
skill_name: ui-generate-api
description: Generate API layer functions for queries (Supabase reads) and commands (POST requests)
version: 1.0.0
author: Frontend Development Team
tags: [ui, api, supabase, cqrs, commands, queries]
---

# API Function Generator Skill

Generate API layer functions for queries (Supabase reads) and commands (POST requests).

## Instructions

You will be provided with:
- Slice JSON file path
- Slice type (STATE_VIEW or STATE_CHANGE)

Your task is to:

1. **Read the slice JSON file** to understand:
   - Fields and their types
   - Read model table name (for STATE_VIEW)
   - Command endpoint (for STATE_CHANGE)
   - Field mappings between frontend and backend

2. **Generate API functions**:
   - For STATE_VIEW: Create Supabase query function in `src/lib/api.ts`
   - For STATE_CHANGE: Create POST command function in `src/lib/api.ts`

3. **Update API client configuration** in `src/lib/api-client.ts`:
   - Add command endpoint to `commandEndpoints` object (for STATE_CHANGE only)

4. **Generate TypeScript interfaces** for parameters and return types

## API Function Patterns

### For STATE_VIEW (Supabase Query)

```typescript
/**
 * Fetch {entity} from read model
 */
export async function fetch{Entity}(): Promise<{Entity}[]> {
  const { data, error } = await supabase
    .from('{table_name}')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch {entity}: ${error.message}`);
  }

  return data || [];
}
```

### For STATE_CHANGE (Command POST)

```typescript
/**
 * {Action description}
 */
export async function {actionCamelCase}{Entity}(
  params: {Action}{Entity}Params
): Promise<void> {
  const response = await apiClient.post(
    commandEndpoints.{ACTION_ENTITY},
    params
  );

  if (!response.ok) {
    throw new Error(`Failed to {action} {entity}`);
  }
}
```

## Command Endpoint Entry

For STATE_CHANGE slices, add to `src/lib/api-client.ts`:

```typescript
export const commandEndpoints = {
  // ... existing endpoints
  {ACTION_ENTITY}: '{commandEndpoint}',
} as const;
```

## Output Format

Provide:

1. **API function** to add to `src/lib/api.ts`
2. **Command endpoint** to add to `src/lib/api-client.ts` (if STATE_CHANGE)
3. **Type interface** for parameters (if STATE_CHANGE)

Example:

```
# API Functions Generated

## Add to src/lib/api.ts

[Function code here]

## Add to src/lib/api-client.ts (commandEndpoints)

CREATE_EVENT: '/api/events/create',

## Type Interface (add to src/types/index.ts if not exists)

export interface CreateEventParams {
  name: string;
  date: string;
  startTime: string;
  endTime: string;
  persons: number;
}
```

## Field Mapping

When generating command functions:
- Map frontend field names to backend field names based on slice definition
- Handle camelCase ↔ snake_case conversions
- Include only fields marked as command parameters in the slice JSON

## Error Handling

- All functions should throw descriptive errors
- Include the operation context in error messages
- For Supabase queries, check the `error` object
- For command POSTs, check response status

## Notes

- Check if the function already exists before adding
- Ensure TypeScript types are properly imported
- For queries, use appropriate Supabase filters if specified in slice
- For commands, ensure all required fields are included
- Follow existing code patterns in the project
