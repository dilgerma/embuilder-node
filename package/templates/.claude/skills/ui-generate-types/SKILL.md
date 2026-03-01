---
skill_name: ui-generate-types
description: Generate TypeScript interfaces from slice field definitions
version: 1.0.0
author: Frontend Development Team
tags: [ui, typescript, types, interfaces, codegen]
---

# Type Generator Skill

Generate TypeScript interfaces from slice field definitions.

## Instructions

You will be provided with:
- Slice JSON file path
- Entity name

Your task is to:

1. **Read the slice JSON file** to understand:
   - All fields and their types
   - Required vs optional fields
   - Field descriptions

2. **Generate TypeScript interfaces**:
   - **Entity interface**: Represents the domain object (for STATE_VIEW slices)
   - **Params interface**: Represents parameters for commands (for STATE_CHANGE slices)

3. **Map slice field types to TypeScript types**:
   - String → `string`
   - Int, Long, Double, Decimal → `number`
   - Boolean → `boolean`
   - Date, DateTime → `string` (ISO format)
   - Time → `string`
   - UUID → `string`
   - Enum → `union type` or `enum`

4. **Add interfaces to** `src/types/index.ts`

## Type Mapping

| Slice Type | TypeScript Type | Notes |
|------------|----------------|-------|
| String | `string` | |
| Int | `number` | |
| Long | `number` | |
| Double | `number` | |
| Decimal | `number` | |
| Boolean | `boolean` | |
| Date | `string` | ISO date string (YYYY-MM-DD) |
| DateTime | `string` | ISO datetime string |
| Time | `string` | HH:mm format |
| UUID | `string` | |
| Enum | `'value1' \| 'value2'` | Union type |

## Interface Templates

### For STATE_VIEW (Entity Interface)

```typescript
/**
 * {Entity description}
 */
export interface {Entity} {
  /** Unique identifier */
  {id_field}: string;

  /** {Field description} */
  {field_name}: {field_type};

  /** Optional field */
  {optional_field}?: {field_type};

  /** Created timestamp */
  created_at?: string;

  /** Updated timestamp */
  updated_at?: string;
}
```

### For STATE_CHANGE (Params Interface)

```typescript
/**
 * Parameters for {action} {entity}
 */
export interface {Action}{Entity}Params {
  /** {Field description} */
  {field_name}: {field_type};

  /** Optional parameter */
  {optional_field}?: {field_type};
}
```

## Output Format

Provide:

1. **TypeScript interfaces** formatted and documented
2. **Location** where to add (typically `src/types/index.ts`)
3. **Notes** on any special type considerations

Example:

```
# Types Generated

## Add to src/types/index.ts

/**
 * Represents an event in the system
 */
export interface Event {
  /** Unique event identifier */
  event_id: string;

  /** Event name */
  name: string;

  /** Event date in YYYY-MM-DD format */
  date: string;

  /** Start time in HH:mm format */
  start_time: string;

  /** End time in HH:mm format */
  end_time: string;

  /** Number of persons */
  persons: number;

  /** Created timestamp */
  created_at?: string;
}

/**
 * Parameters for creating a new event
 */
export interface CreateEventParams {
  /** Event name (max 100 characters) */
  name: string;

  /** Event date in YYYY-MM-DD format */
  date: string;

  /** Start time in HH:mm format */
  startTime: string;

  /** End time in HH:mm format */
  endTime: string;

  /** Number of persons (must be positive) */
  persons: number;
}

## Notes

- Date fields use ISO string format for compatibility with HTML date inputs
- Time fields use HH:mm format
- Field names in params use camelCase (frontend convention)
- Field names in entity match database column names (snake_case)
```

## Special Cases

### Optional Fields

Mark fields as optional with `?` when:
- The slice indicates the field is not required
- The field has a default value
- The field is generated (like timestamps, IDs)

### Enums

For enum fields, create either:

**Option 1: Union Type (preferred for simple cases)**
```typescript
export type EventStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Event {
  status: EventStatus;
}
```

**Option 2: Enum (for complex cases with values)**
```typescript
export enum EventStatus {
  Pending = 'PENDING',
  Confirmed = 'CONFIRMED',
  Cancelled = 'CANCELLED',
}
```

### Nested Objects

If the slice includes nested structures:
```typescript
export interface Address {
  street: string;
  city: string;
  zipCode: string;
}

export interface Customer {
  id: string;
  name: string;
  address: Address;
}
```

## Notes

- Always add JSDoc comments for interfaces and fields
- Include validation constraints in comments (max length, min/max values, etc.)
- Keep entity interfaces separate from params interfaces
- For params, use camelCase field names (frontend convention)
- For entities, match the database schema field names
- Check if types already exist before adding duplicates
- Export all types from `src/types/index.ts`
