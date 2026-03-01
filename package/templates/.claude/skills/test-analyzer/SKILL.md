---
name: test-analyzer
description: analyzes test files and generates slice.json specifications for drift detection
---

## Overview

Analyzes test files (`*.test.ts`) to generate `code-slice.json` specification files. These capture behavioral contracts in given/when/then form, enabling drift detection between tests and `slice.json` design documentation.

**CRITICAL:** This skill NEVER touches existing `slice.json` files. It only creates/deletes `code-slice.json` files.

## Purpose

- Extract test specifications from existing test code
- Generate `code-slice.json` files matching the format of `slice.json` in `.slices/` directory
- Enable drift detection by comparing `code-slice.json` (what tests say) with `slice.json` (design documentation)
- **NEVER modify or delete existing `slice.json` files** - only work with `code-slice.json`

## Input

- Path to a test file (e.g., `ActivateShift.test.ts` or `OnlineReservationStatus.test.ts`)
- Test file must follow given/when/then pattern using:
  - `DeciderSpecification.for()` for state-change slices
  - `PostgreSQLProjectionSpec.for()` for state-view slices

## Output Format

**File:** `.slices/<Context>/<folder>/code-slice.json` (same directory as `slice.json`)

Contains:
```json
{
  "id": "<slice-id-from-slice.json>",
  "title": "<slice-title-from-slice.json>",
  "specifications": [...]
}
```

- MUST include `id` and `title` fields copied from the corresponding `slice.json` file
- NO commands, events, readmodels, or other slice metadata (only id, title, and specifications)
- Each specification has complete nested objects with fields, NOT simple strings
- See [specification-format.md](examples/specification-format.md) for detailed structure

### Specifications Array Content

Include ALL test cases that are:
- NOT already in the `specifications` array of existing `slice.json`
- All given/when/then scenarios from tests (happy path, edge cases, error scenarios)
- Behavioral contracts being tested
- NO implementation details, only specifications

**IMPORTANT:** Even if a command/event is defined in slice.json's commands/events arrays, if the test specification is NOT in the specifications array, it MUST be included in code-slice.json

### Specification Structure

Each specification includes:
- `vertical`: false
- `id`: unique generated ID
- `sliceName`: slice title
- `type`: COMMAND, EVENT, READMODEL or SPEC_ERROR'
- `title`: spec description from test
- `given`: array of event objects (preconditions)
  - STATE_CHANGE: events that happened before
  - STATE_VIEW: events to be projected
  - id is the same as the original elements id
- `when`: command object OR empty array
  - STATE_CHANGE: single command object (the action being tested)
  - STATE_VIEW: empty array `[]` (events are in `given` for projections)
  - id is the same as the original elements id
- `then`: array of event/error/readmodel objects
  - Can be events (what happened as a result, type SPEC_EVENT)
  - Can be errors (SPEC_ERROR type)
  - Can be readmodel assertions (SPEC_READMODEL type for projections)
  - id is the same as the original elements id
- `comments`: empty array
- `linkedId`: MUST be the same as the specification's `id` field (self-reference)

## Supported Slice Types

### 1. STATE_CHANGE Slices

Uses `DeciderSpecification.for()` with decide/evolve pattern.

```typescript
const given = DeciderSpecification.for({
    decide,
    evolve,
    initialState: ...
});

it('spec: description', () => {
    given([...events])
        .when(command)
        .then([...events])
});
```

**See:** [state-change-example.md](examples/state-change-example.md)

### 2. STATE_VIEW Slices

Uses `PostgreSQLProjectionSpec.for()` for projections/read models.

```typescript
given = PostgreSQLProjectionSpec.for({
    projection: SomeProjection,
    connectionString,
});

it('spec: description', () => {
    await given([...events])  // Events are in given() for projections
        .when([])              // when() is always empty for projections
        .then(assertReadModel);
});
```

**IMPORTANT for STATE_VIEW:**
- Events are placed in `given` array (the events to project)
- `when` is always empty array (no command in projections)
- `then` contains readmodel assertions

**See:** [state-view-example.md](examples/state-view-example.md)

## Analysis Process

### Step 1: Identify Slice Type

1. Read the test file
2. Look for `DeciderSpecification.for()` → STATE_CHANGE
3. Look for `PostgreSQLProjectionSpec.for()` → STATE_VIEW
4. Extract slice name from describe block or file name

### Step 2: Extract Test Specifications

For each `it('spec: ...', ...)` test:

1. Extract specification description from test name
2. Identify given events (preconditions)
3. Identify when command/events (action)
4. Identify then events/assertions (postconditions)
5. Map to given/when/then structure
6. **Compare with existing slice.json:**
   - Check if specification already exists in `slice.json` specifications array
   - If exact match found in specifications array → SKIP
   - If NOT in specifications array → INCLUDE (even if command/event element exists)

### Step 3: Extract Element Definitions

#### For STATE_CHANGE:

- **Commands:** Extract from `when()` calls with fields and types
- **Events:** Extract from `given()` and `then()` calls with fields and types
- **Dependencies:** Commands → Events (OUTBOUND), Events → Commands (INBOUND)

#### For STATE_VIEW:

- **Events:** Extract from `given()` calls (events to be projected)
- **IMPORTANT:** `when()` is always empty for STATE_VIEW slices
- **Read Model:** Extract from projection name and assertion logic in `then()`
- **Dependencies:** Events → Read Model (OUTBOUND)

### Step 4: Build Specifications Array

- Include ALL test cases NOT in `slice.json` specifications array
- This includes happy path scenarios, error scenarios, edge cases, and alternative flows
- Format as given/when/then specifications with full field definitions

See [specification-format.md](examples/specification-format.md) for complete format details.

## Slice Name and Context Detection

**Slice Name:**
- Extract from test file name: `<SliceName>.test.ts` → `<SliceName>`
- Example: `ActivateShift.test.ts` → "ActivateShift"

**Context:**
- If metadata contains `restaurantId` or `locationId` → "Restaurant Management"
- Otherwise → extract from aggregate name or default to "General"

**Using `.slices/index.json` for lookup:**
1. Read `.slices/index.json` to find correct folder
2. Match on slice title (case-insensitive)
3. Extract `folder` and `context` from matching entry
4. Construct path: `.slices/<context>/<folder>/slice.json`

## Implementation Steps

When invoked with a test file path:

1. **Read and parse the test file**
   - Use Read tool to load file
   - Identify testing framework pattern

2. **Extract slice metadata**
   - Parse describe block for slice name
   - Determine slice type (DeciderSpecification = STATE_CHANGE, PostgreSQLProjectionSpec = STATE_VIEW)
   - Extract context from metadata fields
   - Infer slice name from file path

3. **Check for existing files**
   - Lookup `slice.json` location via `.slices/index.json`
   - Read `slice.json` if found for comparison
   - Extract `id` and `title` fields from `slice.json` (required for code-slice.json)
   - Track which elements already exist in design documentation

4. **Analyze test cases**
   - Find all `it('spec: ...')` test cases
   - Extract given/when/then structures
   - Compare with existing `slice.json`

5. **Build specifications array**
   - Include ALL test specifications NOT already in `slice.json` specifications array
   - Format with complete field structures (see [specification-format.md](examples/specification-format.md))
   - **CRITICAL: Look up real IDs from slice.json for linkedId fields:**
     - For each command in `when`: Find matching command in `slice.json` → `commands` array by title
     - For each event in `given`/`then`:
       - First try `slice.json` → `events` array by title
       - For STATE_VIEW: If not found, search in `readmodels` → `dependencies` array (INBOUND events)
       - Use the `id` field from the matched element/dependency as the `linkedId`
     - For each readmodel assertion in `then`: Find matching readmodel in `slice.json` → `readmodels` array by title
     - If no match found, use `null` (indicates new element not in design documentation)
     - For errors (SPEC_ERROR): Do NOT include `linkedId` field (errors don't exist in slice.json)

6. **Decision: Generate, Update, or Remove code-slice.json**
   - **Compare test specifications with `slice.json` specifications array**
   - **All test specs in `slice.json` specifications:** Remove/don't create `code-slice.json` (no drift)
   - **Test specs NOT in `slice.json` specifications:** Generate/update `code-slice.json` with:
     - Write to `.slices/<Context>/<folder>/code-slice.json` (same directory as `slice.json`)
     - `id` field copied from `slice.json`
     - `title` field copied from `slice.json`
     - `specifications` array with missing specifications
   - **NEVER touch `slice.json`** - it's read-only design documentation

7. **Validate output**
   - Ensure JSON is valid
   - Verify all required fields present
   - Check structure matches reference format

## Field Type Mapping

Infer TypeScript/JSON types from test data:
- String values → `"String"`
- UUID format → `"UUID"`
- Date strings (ISO format) → `"Date"` or `"DateTime"`
- Numbers with decimals → `"Decimal"`
- Whole numbers → `"Integer"`
- Boolean values → `"Boolean"`
- Arrays → `"List"` with element type

## ID Generation

**CRITICAL: LinkedId Fields Must Use Real IDs from slice.json**

- **linkedId in given/when/then elements**: MUST use the actual element IDs from slice.json
  - Look up command IDs in `slice.json` → `commands` array → `id` field
  - Look up event IDs in `slice.json` → `events` array → `id` field
    - **For STATE_VIEW slices**: Events may not be in the `events` array if they're from other slices
    - Instead, look in `readmodels` → `dependencies` array for entries with `type: "INBOUND"` and `elementType: "EVENT"`
    - Use the `id` field from the dependency entry
  - Look up readmodel IDs in `slice.json` → `readmodels` array → `id` field
  - If element not found in slice.json, use `null` (will be identified as drift)

- **Other ID fields**: Generate unique IDs for specification containers
  - Specification `id`: Generate unique ID (e.g., `"GENERATED-SPEC-<counter>"`)
  - Element wrapper `id`: Generate unique ID for each given/when/then element
  - These are just structural IDs, not the element's identity

**Example from slice.json:**
```json
{
  "commands": [
    {
      "id": "3458764657124632223",  // ← Use THIS for linkedId
      "title": "Activate Shift",
      ...
    }
  ],
  "events": [
    {
      "id": "3458764657005669318",  // ← Use THIS for linkedId
      "title": "Shift activated",
      ...
    }
  ]
}
```

**Example in code-slice.json:**
```json
{
  "id": "GENERATED-SPEC-001",                    // ← Specification ID
  "linkedId": "GENERATED-SPEC-001",              // ← MUST match specification id
  "when": [
    {
      "title": "Activate Shift",
      "id": "GENERATED-SPEC-CMD-1",              // ← Generated wrapper ID
      "linkedId": "3458764657124632223"          // ← MUST be real command ID from slice.json
    }
  ]
}
```

**Summary of linkedId usage:**
1. **Specification level**: `specification.linkedId` = `specification.id` (self-reference)
2. **Element level (given/when/then)**:
   - Commands: `element.linkedId` = real ID from `slice.json` → `commands` array
   - Events: `element.linkedId` = real ID from `slice.json` → `events` array OR `readmodels` → `dependencies` (for STATE_VIEW)
   - Readmodels: `element.linkedId` = real ID from `slice.json` → `readmodels` array
3. **Error elements (SPEC_ERROR)**: No `linkedId` field (errors don't exist in slice.json)

## Usage

Invoke with any test file path:

**State-change slices:**
```
/test-analyzer src/slices/ActivateShift/ActivateShift.test.ts
/test-analyzer src/slices/PlanVacation/PlanVacation.test.ts
```

**State-view slices (projections):**
```
/test-analyzer src/slices/ActivatedOnlineReservations/OnlineReservationStatus.test.ts
/test-analyzer src/slices/ActiveShifts/ActiveShifts.test.ts
```

The skill automatically:
- Detects slice name from file path
- Determines if STATE_CHANGE or STATE_VIEW
- Finds corresponding `.slices/` documentation
- Generates `code-slice.json` in same directory as test file

## Drift Detection Strategy

1. **Compare test specifications with `slice.json` specifications array**
2. **Extract specifications NOT in `slice.json` specifications array:**
   - Happy path scenarios not in specifications
   - Error scenarios (thenThrows) not in specifications
   - Edge cases not in specifications
   - Alternative flows not in specifications
   - **Note:** Even if command/event elements exist in slice.json, if the specification (given/when/then) is not in the specifications array, include it
3. **Actions on `code-slice.json`:**
   - All test specs in `slice.json` specifications → Remove/don't create `code-slice.json` (no drift)
   - Test specs NOT in `slice.json` specifications → Generate/update `code-slice.json`
   - No `slice.json` found → Generate `code-slice.json` with all test specifications

**Key Principle:**
- `slice.json` = design documentation (source of truth, READ ONLY)
- `code-slice.json` = test-derived specifications (generated/deleted by this skill)
- Drift = test specifications that are NOT in slice.json specifications array

## File Locations

- **Test file:** `src/slices/<SliceName>/<SliceName>.test.ts`
- **Output:** `.slices/<Context>/<folder>/code-slice.json` (same directory as slice.json)
- **Index lookup:** `.slices/index.json` (find matching slice by title)
- **Reference:** `.slices/<Context>/<folder>/slice.json` (READ ONLY, from index.json)

## Examples

- [STATE_CHANGE Example](examples/state-change-example.md) - Complete example with ActivateShift slice
- [STATE_VIEW Example](examples/state-view-example.md) - Complete example with OnlineReservationStatus projection
- [Specification Format](examples/specification-format.md) - Detailed JSON structure and field definitions

## Key Notes

- Focus on extracting specifications, not implementation
- Specifications array contains ALL tests NOT already in `slice.json` specifications array
- **Remove `code-slice.json` if no drift detected** (all test specs are in slice.json specifications) - keeps codebase clean
- **Include ALL test specifications** not in slice.json specifications array, including happy path scenarios
- Drift occurs when test specifications are missing from slice.json specifications array, even if the command/event elements are defined
- **NEVER modify or delete `slice.json` files** - they are read-only design documentation
- Generic approach works with any slice - automatically detects name, type, and context
