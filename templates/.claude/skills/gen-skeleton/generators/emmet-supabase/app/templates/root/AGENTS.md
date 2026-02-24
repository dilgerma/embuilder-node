# Agent Learnings

## Core Principles

### Source of Truth
- **config.json is the TRUE source of truth** for slice status - always check it, not just index.json or slice.json
- **slice.json reflects the current specification** for field definitions, event structures, and specifications
- When config.json shows "Planned" but index.json/slice.json show "Done", verify implementation and update config.json
- The aggregate field in slice.json determines domain entity naming (Location → locationId, Restaurant → restaurantId)
- When an event is used by multiple slices, fixing it requires updating ALL slices that use it
- Field names must be consistent across: events, commands, migrations, projections, routes, tests, API docs

### Pre-Implementation Checks
- **Always check if slice already exists** before implementing a "Planned" slice - verify `src/slices/{SliceName}/`
- **Run tests first**: existing implementations may only need test data fixes
- **Search for event usage**: `grep -r "EventName" src/slices/` before modifying events
- **Status drift**: slice status in index.json may lag behind actual implementation

### Slice Status
- Valid statuses: "Done", "Planned", "Assigned", "Created", "Blocked", "Informational"
- **"Assigned" = "Planned"** - treat as equivalent when picking next slice
- Always update status to "Done" after completing implementation and passing tests

## Event Management

### Event Type Naming & Registration
- Event type names MUST use PascalCase (RestaurantRegistered, not Restaurantregistered)
- All new events MUST be added to ContextEvents union type in `src/events/ContextEvents.ts`
- Event types follow `Event<'EventName', {...fields}, {...metadata}>` pattern
- Event titles in slice.json use lowercase (e.g., "Event created" not "Event Created")
- TypeScript type names use PascalCase (e.g., `EventCreated` type)

### Event Field Structure
- DateTime type in slice.json → TypeScript `Date` type (not string)
- Event metadata MUST include restaurantId and userId for multi-tenancy and authorization
- Auto-generated code may have incorrect casing or wrong field types - always verify against slice.json
- Field name typos in slice.json must be preserved for consistency (e.g., "restaurandId")

### Event Verification & Creation
- **Always verify events exist** in `src/events/` and `ContextEvents.ts` before creating them
- Events from unimplemented slices can be created based on their slice.json specifications
- STATE_VIEW slices can reference events that don't exist yet - create them based on slice.json
- Check slice.json → dependencies array (INBOUND) for STATE_VIEW event sources

### Event Structure Changes - CRITICAL
When modifying existing event structure:
1. Find all consumers: `grep -r "EventName" src/slices/`
2. Update ALL occurrences: command handlers, projections, tests, routes, API docs
3. Run `npm run build` BEFORE tests - TypeScript shows ALL files with type mismatches
4. Checklist: Event updated → handlers updated → tests updated → build passes → all tests pass

### Cross-Slice Event Reuse
- Events created for STATE_VIEW projection can be reused by STATE_CHANGE commands
- Same event consumed by multiple projections (e.g., CheckinCancelled)
- Create event once, reference in multiple slice implementations

## Architecture & Auto-Discovery

### Auto-Discovery System
- **Routes**: `src/slices/**/routes.ts` (exports `api` function returning `WebApiSetup`)
- **Processors**: `src/slices/**/processor.ts` (exports `processor = { start: () => {...} }`)
- No manual registration needed - loaded automatically at server startup

### Projections Registration
- All new projections must be registered in `src/common/loadPostgresEventstore.ts`
- **Critical**: When slice files deleted, check for stale imports causing build failures
- Pattern: `grep -n "DeletedSliceName" src/common/loadPostgresEventstore.ts`

### PostgreSQL Critical Imports
```typescript
import { postgreSQLRawSQLProjection } from '@event-driven-io/emmett-postgresql';
import { sql } from '@event-driven-io/dumbo';  // NOT from emmett-postgresql!
import { ContextEvents } from '../../events/ContextEvents';
```
- Always use `.withSchema('public')` in PostgreSQL queries

### Type Coercion
- Pongo stores numeric-looking strings (e.g., "1") as bigints (e.g., 1n)
- Use `String(value)` when comparing IDs in test assertions

## Stream ID Patterns Reference

### `idAttribute` and Stream ID
- If a field on command/event has `"idAttribute": true`, that field is the streamId
- Explicit stream identifier in slice.json takes precedence over `idAttribute`

### Common Stream ID Patterns

| Aggregate Type | Stream ID Format | Helper | Used By |
|---------------|------------------|--------|---------|
| Time Entry | `time-entry-{clerkId}-{month}` | `timeEntryStreamId()` | CheckIn, CheckOut, SubmitTimeEntry, DeleteTimeentry, UpdateTimeEntry |
| Event Assignment | `{restaurantId}-event-{eventId}` | `eventStreamId()` | AssignClerkToEvent, UnAssignClerkFromEvent |
| Shift Publication | `shift-publication-{shiftId}` | N/A | PublishShift, UnpublishShift |

**Notes**: Time entry month format: MMYYYY (e.g., "022026"). Multiple commands can share same stream.

## Implementation Patterns

> For templates and step-by-step guides, use skills: `/state-change-slice`, `/state-view-slice`, `/automation-slice`

### STATE_CHANGE Slice Pattern

**Key Rules**:
- Use proper `initialState` function (not empty object `{}`) in `DeciderSpecification.for()`
- Do NOT add explicit type arguments - let TypeScript infer (avoids TS2558)
- Switch statements: always use explicit `break` to prevent fallthrough bugs

**Structure**:
```typescript
type State = { /* track relevant state */ };
const initialState = (): State => ({ /* defaults */ });
const decide = (state: State, cmd: Command): Event[] => {
  if (invalidCondition) throw 'error.code';
  return [createEvent(cmd)];
};
const evolve = (state: State, event: ContextEvents): State => {
  switch (event.type) {
    case 'EventType': return { ...state, field: newValue };
    default: return state;
  }
};
```

**Error Testing**: Use `.shouldFail()` or `assert.throws()`

### STATE_VIEW Slice Pattern

**Key Rules**:
- Always verify ALL events from slice.json are in `canHandle` array
- Use specific event union type (e.g., `Event1 | Event2`) NOT `ContextEvents` when handling subset
- Missing event handlers = incomplete implementation

**Projection Structure**:
```typescript
export const ProjectionName = postgreSQLRawSQLProjection({
  canHandle: ['Event1', 'Event2'],
  evolve: (event: Event1 | Event2) => {
    switch (event.type) {
      case 'Event1': return sql(db(table).insert({...}).onConflict().merge());
      case 'Event2': return sql(db(table).where({...}).delete());
      default: return [];
    }
  }
});
```

**Event Dependencies**: Look in slice.json → readmodels → dependencies (INBOUND) for event IDs

### AUTOMATION Slice Pattern

**Structure**: STATE_CHANGE + processor.ts + work queue projection

**Processor Implementation**:
```typescript
import * as cron from 'node-cron';
import { createServiceClient } from '../../common/supabaseClient';

const config = { schedule: '*/30 * * * * *', endpoint: "work_queue_table" };

export const processor = {
  start: () => {
    cron.schedule(config.schedule, async () => {
      const client = createServiceClient();
      const result = await client.from(config.endpoint)
        .select("*").eq('must_process', true).limit(1);

      if (result.error) return;
      for (const item of result.data ?? []) {
        try {
          await handleCommand(streamId, command, { userId: 'system', ...metadata });
        } catch (error) {
          console.error('Processing error:', error);
        }
      }
    });
  }
};
```

**Key Rules**:
- Use `.limit(1)` to process one item at a time
- `createServiceClient()` bypasses RLS for automation
- Processor uses snake_case column names (e.g., `reservation_id`)
- Work queue lifecycle: add on trigger → update flags → delete on completion

## State Tracking Patterns

### Boolean/Toggle State
```typescript
type State = { isActive: boolean };
const decide = (state: State, cmd: Command): Event[] => {
  if (state.isActive) throw "already.active";  // Activate guard
  if (!state.isActive) throw "not.active";     // Deactivate guard
  return [event];
};
```

**Database**: Use flag column (e.g., `is_online_active BOOLEAN`), update with upsert `.onConflict().merge()`

### Set<string> for ID Tracking
```typescript
type State = { trackedIds: Set<string> };
const evolve = (state: State, event: ContextEvents): State => {
  switch (event.type) {
    case 'ItemAdded': return { trackedIds: new Set([...state.trackedIds, event.data.id]) };
    case 'ItemRemoved':
      const newSet = new Set(state.trackedIds);
      newSet.delete(event.data.id);
      return { trackedIds: newSet };
  }
};
```

**Examples**: UnAssign Clerk from Event, Delete Time Entry, Update Time Entry

### Multi-Flag State Machine
```typescript
type State = { submitted: boolean; reverted: boolean; approved: boolean; declined: boolean };
const decide = (state: State, cmd: Command): Event[] => {
  if (state.submitted) throw 'cannot submit twice';
  if (!state.submitted) throw 'not_submitted';
  if (state.reverted) throw 'already_reverted';
  return [event];
};
```

**Workflows**: Timesheet (Submitted → Reverted → Resubmitted), Approval (Approved → Declined → Reapproved)

## Database & Projections

### Migration Rules
- **NEVER modify existing migrations** - always add new ones
- Version check: `ls -1 supabase/migrations/ | grep "^V" | sort -V | tail -5`
- Naming: `V{N}__{table_name}.sql` (e.g., `V41__clerk_details.sql`)
- PostgreSQL types: Use TEXT/VARCHAR (not "string"), valid UUID format required
- Composite PKs for multi-tenant: `PRIMARY KEY (restaurant_id, entity_id)`

### Projection Patterns

**Add/Remove**:
```typescript
case 'Added': return sql(db(table).insert({...}).onConflict(key).merge());
case 'Removed': return sql(db(table).where({id}).delete());
```

**Work Queue Lifecycle**:
```typescript
case 'TriggerEvent': return sql(db(table).insert({id, must_process: false}).onConflict().merge());
case 'ProgressEvent': return sql(db(table).where({id}).update({must_process: true}));
case 'CompletionEvent': return sql(db(table).where({id}).delete());
```

**Conditional Flags**: Set flags based on matching business data (e.g., `must_cancel = true` only when clerkId matches)

### JSONB Field Handling
- PostgreSQL JSONB auto-parsed by pg driver - DO NOT use `JSON.parse()` in tests
- Storage: `assignees JSONB DEFAULT '[]'::jsonb`
- Updates: `assignees: JSON.stringify(data.assignees)` (plain JavaScript, not raw SQL)
- Array conversion for display: `Array.isArray(field) ? field.join(', ') : field || ''`

### Query Endpoints - Authentication
All endpoints must:
1. Require JWT: `requireUser(req, res, true)`
2. Filter by authenticated user's ID
3. Use anon key Supabase client

### Date Handling
- slice.json DateTime → TypeScript `Date` type
- Routes: `date: new Date(assertNotEmpty(req.body.date))`
- Tests: Use Date objects: `new Date('2026-03-15T10:00:00Z')`
- Timezone: Europe/Berlin → UTC conversion (CET = UTC+1, CEST = UTC+2 for DST)

## Test Patterns Reference

### STATE_CHANGE Tests
```typescript
DeciderSpecification.for(decide, evolve, initialState)
  .given([PrerequisiteEvent1, PrerequisiteEvent2])
  .when(Command({ field: 'value' }))
  .then([ExpectedEvent({ field: 'value' })]);
```

### STATE_VIEW Tests
```typescript
PostgreSQLProjectionSpec.for(ProjectionName)
  .given([Event1, Event2])
  .when([])  // Always empty
  .then(async (state) => {
    const result = await state.query();
    assert.equal(result[0].field, expectedValue);
  });
```

### Error Case Tests
```typescript
.given([EventCreated])
.when(Command)
.shouldFail();  // Expects error
```

### Test Coverage
- **STATE_CHANGE**: Happy path + all error guards
- **STATE_VIEW**: One test per INBOUND event dependency
- **AUTOMATION**: Command logic + error guards (processor not unit tested)

## Test Specifications & code-slice.json

### Purpose of test-analyzer
- Analyzes tests to extract behavioral specifications
- Generates code-slice.json in `.slices/{Context}/{folder}/`
- Includes only specs NOT in slice.json (drift detection)

### Drift Detection
**Generate code-slice.json when**:
- Test specs NOT in slice.json specifications array
- slice.json has `specifications: []` but tests exist

**No code-slice.json when** (No Drift):
- All test specs already in slice.json
- Quality indicator: implementation matches design

### linkedId Lookup
**STATE_CHANGE**: Command/Event IDs from slice.json → commands/events array → id field
**STATE_VIEW**: Event IDs from slice.json → readmodels → dependencies (INBOUND) → id field

```bash
# Find slice.json for event source
find .slices -name "slice.json" -path "*{slicename}*"

# Extract event ID (use lowercase title)
cat path/to/slice.json | jq '.events[] | select(.title == "Event created") | .id'
```

**Note**: Event titles in slice.json are lowercase ("Event created"), TypeScript types are PascalCase (`EventCreated`)

### Field Type Mapping
- UUID format → "UUID" type
- ISO dates → "String" or "Date"
- Whole numbers → "Integer"
- Text → "String"
- Cardinality: "Single" for non-array fields

## Implementation Quality Checklist

### Standard Workflow (All Slices)
1. [ ] Build passes: `npm run build`
2. [ ] All tests pass: `npm run test`
3. [ ] Run test-analyzer skill (if drift detected)
4. [ ] Update `.slices/index.json` status to "Done"
5. [ ] Update `progress.txt` with iteration summary
6. [ ] Update `AGENTS.md` with new learnings
7. [ ] Commit with Co-Authored-By line

### Additional: AUTOMATION Slices
- [ ] Processor.ts with CRON schedule
- [ ] Routes for manual invocation
- [ ] Test includes error cases

### Additional: STATE_VIEW Slices
- [ ] All INBOUND events in canHandle array
- [ ] Each event has handler in evolve
- [ ] Test per INBOUND event
- [ ] Projection registered in `loadPostgresEventstore.ts`

### Additional: Completing Partial Slices
- [ ] Verify all dependencies from slice.json implemented
- [ ] Compare canHandle with dependencies
- [ ] Add missing handlers and tests

### Event Structure Changes
- [ ] Event definition updated
- [ ] All command handlers updated
- [ ] All consuming slice tests updated
- [ ] Build passes, all tests pass

## Common Patterns by Domain

### Time Entry Domain

**Stream ID**: `time-entry-{clerkId}-{month}` (MMYYYY format)

**Key Events**: CheckedIn, CheckedOut, TimeEntryAdded, TimesheetSubmitted, SubmissionReverted, TimesheetApproved, TimesheetDeclined, CheckinCancelled

**Workflow**:
1. CheckIn → ActiveCheckins
2. CheckOut → TimeEntryCheckoutsToProcess (work queue)
3. ProcessTimeEntryCheckout (automation) → TimeEntryAdded
4. SubmitTimeEntry → ActiveCheckinsToCancel (mark for cancellation)
5. CancelCheckin (automation) → CheckinCancelled
6. SubmitTimesheet → TimesheetSubmitted → SubmissionDate, SubmissionStatus
7. ApproveTimesheet → TimesheetApproved → ApprovalDate
8. DeclineTimesheet → TimesheetDeclined (allows reapproval)

**Hours Calculation**: `(endDate - startDate) ms / (1000*60*60)`, rounded to 0.5

**Guard Patterns**:
- CheckOut: if CheckedOut in stream → throw "no active check"
- ProcessTimeEntryCheckout: if NO CheckedOut → throw "no confirmed checkout"
- SubmitTimesheet: if submitted → throw "cannot submit twice"
- Delete/Update: track Set<string> of entry IDs
- SubmitTimeEntry: if `approved && !declined` → throw "cannot submit time entry after approval"
- DeleteTimeentry: if `approved && !declined` → throw "cannot delete after approval"
- UpdateTimeEntry: if `submitted && !declined` → throw "cannot submit after submission"

**Cross-Slice State Rules (Time Entry Approval Guards)**:
- `TimesheetApproved` event: sets `approved=true, declined=false`
- `TimesheetDeclined` event: sets `approved=false, declined=true` (resets approval, re-enables submit/delete/update)
- `SubmissionReverted` event: sets `approved=false` (allows new submissions after revert)
- Multiple commands track the same approval state: SubmitTimeEntry, DeleteTimeentry, UpdateTimeEntry
- Decline AFTER approval is valid workflow (and allows subsequent operations)

### Event Assignment Domain

**Stream ID**: `{restaurantId}-event-{eventId}` via `eventStreamId()` helper

**Key Events**: EventCreated, EventCancelled, EventPlanned, EventReplanned, ClerkAssignedToEvent, ClerkUnassignedFromEvent

**Inverse Operations**:
- Assign/UnAssign share same stream ID
- Use Set<string> for tracking assigned clerks
- Assign guard: `if (has(clerkId)) throw "already.assigned"`
- UnAssign guard: `if (!has(clerkId)) throw "not.assigned"`

**Planning**: EventReplanned resets isPlanned to false (allows re-planning)

### Activation/Deactivation Pattern

**Complementary Commands**:
- Both track same boolean state, validate opposite conditions
- Activate: `if (active) throw "already.active"`
- Deactivate: `if (!active) throw "not.active"`
- Shared evolve handles BOTH events

**Implementation Order**: events → STATE_VIEW → Activate → Deactivate

**Examples**: OnlineReservation, Shift Publication

### Dashboard Read Models

**Characteristics**:
- Handle 4 events: Create, Cancel, Assign, Unassign
- JSONB assignees array
- PRIMARY KEY on entity_id
- Table naming: `active_{entity}_for_dashboard`

**Test Pattern**: Create → Assignment/unassignment → Delete

## Common Gotchas

### Hooks Rewrite Files
- Claude Code hooks extensively rewrite files after save
- Always read files AFTER hook execution
- Hooks add restaurantId, userId, enrich ContextEvents.ts

### Auto-Generation Issues
- Migration files may get auto-numbered incorrectly (V99) - renumber
- Projection `canHandle` may be incomplete - verify against slice.json
- Pre-generated routes may use wrong streamId

### TypeScript Issues
- Don't chain `.given()` directly on `DeciderSpecification.for()`
- macOS filesystem case-insensitive, TypeScript imports case-sensitive
- Use specific event union, NOT `ContextEvents` when handling subset
- Don't add explicit type arguments to `DeciderSpecification.for()`

### State Management
- Always use explicit `break` in switch statements
- Tests for state-dependent commands need prerequisite events in given
- Paired commands share same stream
- Use proper `initialState` function (not `{}`)

### Knex/Database
- `.insert({...}).del()` does NOT insert - it deletes
- Use `.insert().onConflict().merge()` for upserts
- Use `.where().update()` or `.where().delete()` for modifications

### Specifications
- Empty `specifications: []` → create tests covering event dependencies
- Dependency-only events → include in `canHandle` as no-op (return `[]`)
- Spec assertions may target different read model than slice's own
- Pre-existing test failures don't block new slice implementation

### Metadata Updates
- Specs may be added to slice.json AFTER tests implemented
- Verify executable tests exist before assuming new work needed
- If tests exist and pass → metadata sync → commit as "chore: sync specifications"

## Error Handling

- HTTP 409 for conflicts, HTTP 500 for server errors
- Business-friendly error codes (e.g., "already.active", "not.assigned")
- German error messages typical in this codebase
- Check errors most specific to most general (e.g., not_submitted → already_reverted → already_approved)

## UI Documentation (ui-prompt.md)

Each STATE_CHANGE slice should include `ui-prompt.md` with:
1. Endpoint URL + HTTP method
2. Payload example (realistic JSON)
3. Required headers (correlation_id, Authorization)
4. Response format (success/error)
5. Field descriptions + API client code + curl commands

For STATE_VIEW: include query endpoint docs + database table definition.
