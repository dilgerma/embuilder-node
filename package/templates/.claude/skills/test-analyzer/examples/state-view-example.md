# STATE_VIEW Slice Example

## Input Test File

**File:** `src/slices/ActivatedOnlineReservations/OnlineReservationStatus.test.ts`

```typescript
describe('OnlineReservationStatus Specification', () => {
    it('spec: Online reservation activated - sets active to true', async () => {
        await given([{type: 'OnlineReservationActivated', data: {restaurantId: 'r1'}}])
            .when([])  // empty for projections
            .then(assertReadModel);
    });

    it('spec: Toggle online reservation - activates then deactivates', async () => {
        await given([
                {type: 'OnlineReservationActivated', data: {restaurantId: 'r1'}},
                {type: 'OnlineReservationDeactivated', data: {restaurantId: 'r1'}}
            ])
            .when([])  // empty for projections
            .then(assertReadModel);
    });
});
```

## Processing Steps

1. Slice name detected: "OnlineReservationStatus" (from file path or describe block)
2. Looks up in `.slices/index.json` → searches for matching slice title
3. Gets folder and context from index
4. Reads corresponding `.slices/<context>/<folder>/slice.json`
5. Compares test events with slice.json
6. If "toggle" scenario not in slice.json → include in specifications
7. **CRITICAL: Looks up real event IDs:**
   - Events may be defined in other slices, but referenced in readmodel dependencies
   - Search for event IDs in the readmodel's `dependencies` array with `type: "INBOUND"`
   - "Online Reservation Activated" → ID `"3458764659470382480"` (from dependencies)
   - "Online Reservation Deactivated" → ID `"3458764659470541221"` (from dependencies)

## Output

**File:** `src/slices/ActivatedOnlineReservations/code-slice.json`

```json
{
  "id": "3458764659470991969",
  "title": "slice: Activated Online reservations",
  "specifications": [
    {
      "vertical": false,
      "id": "3458764660410460001",
      "sliceName": "slice: Online Reservation Status",
      "title": "spec: Toggle online reservation - activates then deactivates",
      "given": [
        {
          "title": "Online Reservation Activated",
          "tags": [],
          "id": "3458764660410460002",
          "index": 0,
          "specRow": -1,
          "type": "SPEC_EVENT",
          "fields": [
            {
              "name": "restaurantId",
              "type": "String",
              "subfields": [],
              "cardinality": "Single",
              "example": "r1"
            }
          ],
          "linkedId": "3458764659470382480"
        },
        {
          "title": "Online Reservation Deactivated",
          "tags": [],
          "id": "3458764660410460003",
          "index": 1,
          "specRow": -1,
          "type": "SPEC_EVENT",
          "fields": [
            {
              "name": "restaurantId",
              "type": "String",
              "subfields": [],
              "cardinality": "Single",
              "example": "r1"
            }
          ],
          "linkedId": "3458764659470541221"
        }
      ],
      "when": [],
      "then": [
        {
          "title": "active = false in read model",
          "tags": [],
          "id": "3458764660410460004",
          "index": 0,
          "specRow": -1,
          "type": "SPEC_READMODEL",
          "fields": []
        }
      ],
      "comments": [],
      "linkedId": "3458764660410460001"
    }
  ]
}
```

## Key Points

- **Top-level fields**: `id` and `title` are copied from the corresponding `slice.json` in `.slices/Restaurant Management/activatedonlinereservations/slice.json`
- **Specification linkedId**: `"3458764660410460001"` matches the specification's `id` field (self-reference)
- **Given**: Array of events to be projected (this is where events go for STATE_VIEW)
  - **CRITICAL**: Each event's `linkedId` uses the REAL event ID from slice.json
  - "Online Reservation Activated" → `linkedId: "3458764659470382480"`
  - "Online Reservation Deactivated" → `linkedId: "3458764659470541221"`
  - For STATE_VIEW slices, look for event IDs in the readmodel's `dependencies` array
- **When**: Empty array (no command in projections)
- **Then**: Readmodel assertion (SPEC_READMODEL type)
- Only the "toggle" scenario is included because it represents additional behavior beyond basic projection
