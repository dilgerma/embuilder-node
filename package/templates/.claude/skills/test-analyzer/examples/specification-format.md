# Specification Format Template

## Output File Structure

The `code-slice.json` file contains:

```json
{
  "id": "<slice-id-from-slice.json>",
  "title": "<slice-title-from-slice.json>",
  "specifications": [...]
}
```

**CRITICAL:**
- MUST include `id` and `title` fields copied from the corresponding `slice.json` file
- NO commands, events, readmodels, or other slice metadata (only id, title, and specifications)
- Each specification must have complete nested objects with fields, NOT simple strings
- Given/when/then must be arrays of objects with full field definitions

## Specification Object Template

```json
{
  "vertical": false,
  "id": "<generated-id>",
  "sliceName": "slice: <SliceName>",
  "title": "spec: <test description>",
  "given": [
    {
      "title": "<Event Title>",
      "tags": [],
      "id": "<generated-id>",
      "index": 0,
      "specRow": -1,
      "type": "SPEC_EVENT",
      "fields": [
        {
          "name": "fieldName",
          "type": "String|Date|UUID|Integer|Boolean|Decimal",
          "subfields": [],
          "cardinality": "Single",
          "example": ""
        }
      ],
      "linkedId": "<linked-event-id-from-elements>"
    }
  ],
  "when": [
    {
      "title": "<Command Title>",
      "tags": [],
      "id": "<generated-id>",
      "index": 0,
      "specRow": -1,
      "type": "SPEC_COMMAND",
      "fields": [
        {
          "name": "fieldName",
          "type": "String|Date|UUID|Integer|Boolean|Decimal",
          "subfields": [],
          "cardinality": "Single",
          "example": ""
        }
      ],
      "linkedId": "<linked-command-id-from-elements>"
    }
  ],
  "then": [
    {
      "title": "<Event or Error Title>",
      "tags": [],
      "id": "<generated-id>",
      "index": 0,
      "specRow": -1,
      "type": "SPEC_EVENT|SPEC_ERROR|SPEC_READMODEL",
      "fields": [
        {
          "name": "fieldName",
          "type": "String|Date|UUID|Integer|Boolean|Decimal",
          "subfields": [],
          "cardinality": "Single",
          "example": ""
        }
      ],
      "linkedId": "<linked-event-id-from-elements>"
    }
  ],
  "comments": [],
  "linkedId": "<same-as-specification-id-above>"
}
```

## Given/When/Then Structure

### For STATE_CHANGE Slices

- **given**: Array of event objects (preconditions - events that happened before)
- **when**: Array with single command object (the action being tested)
- **then**: Array of event/error objects (what happened as a result)

### For STATE_VIEW Slices

- **given**: Array of event objects (events to be projected)
- **when**: Empty array `[]` (no command in projections)
- **then**: Array with readmodel assertion objects (SPEC_READMODEL type)

## Field Object Structure

Each field in the `fields` array must have:

```json
{
  "name": "fieldName",
  "type": "String|Date|UUID|Integer|Boolean|Decimal|Integer|List",
  "subfields": [],
  "cardinality": "Single|Multiple",
  "example": "actual value from test"
}
```

### Field Type Mapping

Infer types from test data:
- String values → `"String"`
- UUID format → `"UUID"`
- Date strings (ISO format) → `"Date"` or `"DateTime"`
- Numbers with decimals → `"Decimal"`
- Whole numbers → `"Integer"`
- Boolean values → `"Boolean"`
- Arrays → `"List"` with element type

### Cardinality

- `"Single"` - for single values
- `"Multiple"` - for arrays

## Element Types

- `SPEC_COMMAND` - Command in `when` array (STATE_CHANGE only)
- `SPEC_EVENT` - Event in `given` or `then` arrays
- `SPEC_ERROR` - Error in `then` array (when test uses `thenThrows()`)
- `SPEC_READMODEL` - Readmodel assertion in `then` array (STATE_VIEW only)
