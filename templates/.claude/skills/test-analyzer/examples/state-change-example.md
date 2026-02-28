# STATE_CHANGE Slice Example

## Input Test File

**File:** `src/slices/ActivateShift/ActivateShift.test.ts`

```typescript
describe('Activate Shift Specification', () => {
    it('spec: Activate Shift - scenario', () => {
        given([{
            type: 'ShiftCreated',
            data: { shiftId: '123', restaurantId: 'r1', startDate: '2026-01-15' }
        }])
            .when({ type: 'ActivateShift', data: { shiftId: '123', restaurantId: 'r1' }})
            .then([{
                type: 'ShiftActivated',
                data: { shiftId: '123', restaurantId: 'r1' }
            }])
    });

    it('spec: Activate Shift - shift not found', () => {
        given([])
            .when({ type: 'ActivateShift', data: { shiftId: '999', restaurantId: 'r1' }})
            .thenThrows()
    });
});
```

## Processing Steps

1. Slice name detected: "ActivateShift" (from file path)
2. Looks up in `.slices/index.json` → finds entry with `"slice": "slice: Activate Shift"`
3. Gets folder: "activateshift" and context: "Restaurant Management"
4. Reads: `.slices/Restaurant Management/activateshift/slice.json`
5. Checks specifications array in slice.json for existing test specs
6. First test found in slice.json specifications array → not included in code-slice.json
7. Second test (error case) NOT in slice.json specifications array → included in code-slice.json
8. **CRITICAL: Looks up real IDs from slice.json:**
   - Command "Activate Shift" → finds `"id": "3458764657124632223"` in slice.json commands array
   - Uses this real ID as `linkedId` for the command in the specification

## Output

**File:** `src/slices/ActivateShift/code-slice.json`

```json
{
  "id": "3458764657124632353",
  "title": "slice: Activate Shift",
  "specifications": [
    {
      "vertical": false,
      "id": "3458764660410459999",
      "sliceName": "slice: Activate Shift",
      "title": "spec: Activate Shift - shift not found",
      "given": [],
      "when": [
        {
          "title": "Activate Shift",
          "tags": [],
          "id": "3458764660410459998",
          "index": 0,
          "specRow": -1,
          "type": "SPEC_COMMAND",
          "fields": [
            {
              "name": "shiftId",
              "type": "String",
              "subfields": [],
              "cardinality": "Single",
              "example": "999"
            },
            {
              "name": "restaurantId",
              "type": "String",
              "subfields": [],
              "cardinality": "Single",
              "example": "r1"
            }
          ],
          "linkedId": "3458764657124632223"
        }
      ],
      "then": [
        {
          "title": "Shift not found error",
          "tags": [],
          "id": "3458764660410459997",
          "index": 0,
          "specRow": -1,
          "type": "SPEC_ERROR",
          "fields": []
        }
      ],
      "comments": [],
      "linkedId": "3458764660410459999"
    }
  ]
}
```

## Key Points

- **Top-level fields**: `id` and `title` are copied from `.slices/Restaurant Management/activateshift/slice.json`
- **Given**: Empty array (no preconditions for error case)
- **When**: Single command object with full field definitions
  - **CRITICAL**: `linkedId` is `"3458764657124632223"` - the REAL ID from slice.json commands array for "Activate Shift" command
- **Then**: Error object (SPEC_ERROR type) with empty fields
  - Errors have no `linkedId` field (they don't represent elements in slice.json)
- Only the error case is included because the happy path specification already exists in slice.json specifications array
- If slice.json specifications array is empty, ALL test specifications would be included in code-slice.json
