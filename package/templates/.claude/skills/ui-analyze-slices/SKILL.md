---
skill_name: ui-analyze-slices
description: Analyze slice JSON files to identify grouping, dependencies, and implementation strategy
version: 1.0.0
author: Frontend Development Team
tags: [ui, analysis, slices, planning, cqrs]
---

# Slice Analyzer Skill

Analyze slice JSON files to identify grouping, dependencies, and implementation strategy.

## Instructions

You will be provided with one or more slice JSON file paths. Your task is to:

1. **Read all slice JSON files** provided
2. **Analyze and extract**:
   - Slice names and types (STATE_VIEW, STATE_CHANGE)
   - Group IDs (`groupId` field)
   - Entity names derived from slice names
   - Read model table names (for STATE_VIEW slices)
   - Command endpoints (for STATE_CHANGE slices)
   - UI prompts from `codeGen.uiPrompts` array
   - Field definitions for each slice

3. **Group slices** by their `groupId`

4. **Identify UI prompt locations**:
   - Check for `ui-prompt.md` in the slice folder in /backend/src/slices. Those files have been provided by the backend engineers.
   - Extract prompts from `codeGen.uiPrompts` if present from the slice.json

5. **Recommend implementation strategy**:
   - Which hooks to create (query hooks for STATE_VIEW, mutation hooks for STATE_CHANGE)
   - Which components to scaffold (List, Dialog, Page)
   - How to combine slices in the same group

## Output Format

Provide a structured analysis in the following format:

```
# Slice Analysis Results

## Groups Found

### Group: "{groupId}" ({count} slices)

**Slices:**
1. **{sliceName}** (TYPE: {STATE_VIEW|STATE_CHANGE})
   - Entity: {entityName}
   - Table/Endpoint: {tableName or commandEndpoint}
   - Fields: {list of field names}
   - Recommended Hook: {hookName}()

2. **{sliceName}** ...

**UI Prompts:**
- codeGen.uiPrompts:
  - "{prompt1}"
  - "{prompt2}"
- ui-prompt.md: {Found/Not Found} at {path}

**Implementation Recommendations:**
- Create hooks: {list of hook names}
- Create components: {list of component names}
- Page composition: {description of how to combine}

---

## Ungrouped Slices

(List any slices without a groupId)

---

## Summary

Total Slices: {count}
Groups: {count}
STATE_VIEW slices: {count}
STATE_CHANGE slices: {count}
```

## Example Usage

User provides: `src/slices/events/CreateEvent.json`, `src/slices/events/ViewEvents.json`

You should:
1. Read both JSON files
2. Identify they belong to the same group (e.g., "event-management")
3. Determine ViewEvents is STATE_VIEW, CreateEvent is STATE_CHANGE
4. Check for ui-prompt.md in `src/slices/events/`
5. Recommend creating `useEvents()` query hook and `useCreateEvent()` mutation hook
6. Suggest creating EventList component, CreateEventDialog, and EventsPage

## Notes

- Always read the actual JSON files before analyzing
- Look for common patterns in slice naming to infer entity names
- Consider whether slices in the same group should be on the same page or separate pages
- Identify any dependencies between slices (e.g., a create action should refresh a list view)
