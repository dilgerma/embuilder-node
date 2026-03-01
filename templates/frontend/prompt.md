# Frontend Agent Prompt - UI Component Generation

Build React + TypeScript UI components from slice JSON definitions using established patterns.

## Your Task

If a slice is in status 'planned', Even if a slice seems to have been implemented, make sure to verify the implementation, check for new fields, additional custom prompts in the slice json. A "planned" slice can also be an update of an existing slice. If that is the case, match the implemenetation to the updated slice definition.

0. Do not read the entire code base. read /frontend/AGENTS.md. Focus on the tasks in this description.
1. Read the description at `.slices/index.json` (in the same directory as this file). Every item in status "planned"  and assigned to "ui_worker" is a task.
2. Read the progress log at `progress.txt` (check Codebase Patterns section first)
3. Make sure you are on the right branch "feature/<slicename>", the branch should exist.
5. Pick the **highest priority** task assigned to ui_worker. This becomes your PRD. Set the status "InProgress", add a started_date ( including date and time ) in the index.json. If no slice has status planned, reply with:
   <promise>NO_TASKS</promise> and stop. Do not work on other slices.
6. Pick the slice definition from the project root /.slices in <folder> defined in the prd. Never work on more than one slice per iteration.
7. A slice can define additional prompts as codegen/uiPrompt. any additional prompts defined in backend are hints for the implementation of the slice and have to be taken into account. If you use the additional prompt, add a line in progress.txt
8. Write a short progress one liner after each step to progress.txt
9. Analyze and Implement according to the Rest of the instructions in this file, make use of the skills in the skills directory, but also your previsously collected
   knowledge. Make a list TODO list for what needs to be done. Also make sure to adjust the implementation according to the json definition.
10. The slice in the json is always true, the code follows what is defined in the json
11. the slice is only 'Done' if APIs are implemented.
12. make sure to read the ui-prompt.md in /backend/src/slices/<slice>
13. If a custom uiPrompt in the slice.json defines where  the  component should be mounted, this always has to be done. If no mount point is defined in uiPrompt, verify if there is natural place where to mount a component. If there is no natural place, create a new page,  name it after the componenet and define a Route in App.tsx
14. Run quality checks ( npm run build, tsc ) - Attention - the slice is only done if the component is placed somewhere.
16. Update the Slice in the index.json to status 'Done' and remove assignment
17. If checks pass, commit ALL changes with message: `feat: [Slice Name]` and merge back to main as FF merge ( update
    first )
18. Append your progress to `progress.txt` after each step in the iteration.
19. append your new learnings to frontend/AGENTS.md in a compressed form, reusable for future iterations. Only add learnings if they are not already there.
20. Finish the iteration.

---

## 0. Available Skills (Use These!)

This project has custom skills available in `.claude/skills/` that automate common tasks:

- **`/ui-build-slice-ui`**: Complete orchestrator - builds entire UI from slice definitions (types → API → hooks → components)
- **`/ui-analyze-slices`**: Analyze slice JSON files to identify grouping, dependencies, and implementation strategy
- **`/ui-read-ui-prompts`**: Find and parse UI prompts from slice definitions and `ui-prompt.md`
- **`/ui-generate-types`**: Generate TypeScript interfaces from slice field definitions
- **`/ui-generate-api`**: Generate API layer functions for queries (Supabase) and commands (POST)
- **`/ui-generate-hook`**: Generate React Query hooks for STATE_VIEW (queries) and STATE_CHANGE (mutations)
- **`/ui-scaffold-component`**: Scaffold React components (List, Dialog, Page) using Bulma CSS

**IMPORTANT**: When asked to build UI from slices, USE the `/ui-build-slice-ui` skill first! It will orchestrate all other skills in the correct order. Only use individual skills when you need to regenerate or modify a specific part.
**IMPORTANT**: Unless stated in a custom prompt, components read directly from the tables provided, not from api-endpoints via HTTP

---

## 1. Slice Composition (CRITICAL)

### Slice Types

- **STATE_VIEW**: One read model table → Query hook → List component
- **STATE_CHANGE**: One command/POST endpoint → Mutation hook → Form/Dialog

### Grouping Rule

**Slices with same `groupId` → Implement together as one component**

```javascript
// Multiple slices, same groupId → One component
Slice A: { groupId: "123", sliceType: "STATE_VIEW", title: "Events View" }
Slice B: { groupId: "123", sliceType: "STATE_CHANGE", title: "Create Event" }
Slice C: { groupId: "123", sliceType: "STATE_CHANGE", title: "Cancel Event" }
// → Combine into EventsPage component
```

### UI Prompts Priority

1. Check `ui-prompt.md` (detailed specs) - Use `/ui-read-ui-prompts` skill
2. Check `codeGen.uiPrompts` array (high-level guidance) - Use `/ui-read-ui-prompts` skill
3. Follow this prompt (standard patterns)
4. Keep it simple if no guidance

---

## 2. Authentication & API Context

```typescript
// AuthContext: user, session, restaurantId
import { useAuth } from "@/contexts/AuthContext";
const { user, session } = useAuth();

// ApiContext: token, restaurantId, userId (auto-injected into headers)
import { useApiContext } from "@/hooks/useApiContext";
const ctx = useApiContext();
```

---

## 3. Hooks Pattern

### Query Hook (STATE_VIEW)

```typescript
// src/hooks/api/useEvents.ts
import { useQuery } from "@tanstack/react-query";
import * as api from "@/lib/api";

export function useEvents() {
    return useQuery({
        queryKey: ["events"],
        queryFn: () => api.fetchEvents(),
    });
}
```

### Mutation Hook (STATE_CHANGE)

```typescript
export function useCreateEvent() {
    const ctx = useApiContext();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: api.CreateEventParams) => api.createEvent(params, ctx),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["events"] });
        },
    });
}
```

---

## 4. API Layer (CQRS)

### Query (Read from Supabase)

```typescript
// src/lib/api.ts
export async function fetchEvents(): Promise<Event[]> {
    const { data, error } = await supabase
        .from("events_for_planning")  // Read model table
        .select("*");
    if (error) throw new Error(error.message);
    return data || [];
}
```

### Command (POST to Backend)

```typescript
export async function createEvent(params: CreateEventParams, ctx: ApiContext) {
    const response = await apiRequest(
        commandEndpoints.createEvent,  // /api/createevent
        ctx,
        { method: "POST", body: { ...params } }
    );
    if (!response.ok) throw new Error(response.error);
    return response.data;
}
```

**Add endpoint in `src/lib/api-client.ts`**:
```typescript
export const commandEndpoints = {
    createEvent: "/api/createevent",
    // ...
};
```

---

## 5. Component Patterns

### List Component (STATE_VIEW)

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/hooks/api/useEvents";

export function EventList() {
    const { data: events = [], isLoading } = useEvents();

    if (isLoading) {
        return <Skeleton className="h-20 w-full" />;
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {events.map(event => (
                    <Card key={event.id}>
                        <CardHeader><CardTitle>{event.name}</CardTitle></CardHeader>
            <CardContent>{event.date}</CardContent>
            </Card>
    ))}
    </div>
);
}
```

### Dialog Component (STATE_CHANGE)

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateEvent } from "@/hooks/api/useEvents";
import { toast } from "sonner";

export function CreateEventDialog({ open, onOpenChange }) {
    const createEvent = useCreateEvent();
    const [form, setForm] = useState({ name: "", date: "" });

    const handleSubmit = async () => {
        if (!form.name) return toast.error("Name required");
        try {
            await createEvent.mutateAsync(form);
            toast.success("Planned");
            onOpenChange(false);
        } catch (err) {
            toast.error(`Error: ${err.message}`);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader><DialogTitle>Create Event</DialogTitle></DialogHeader>
    <div className="space-y-4">
        <div>
            <Label>Name</Label>
        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
    </div>
    <Button onClick={handleSubmit} disabled={createEvent.isPending}>
        Create
        </Button>
        </div>
        </DialogContent>
        </Dialog>
);
}
```

### Page Composition (Combine Slices)

```typescript
export function EventsPage() {
    const [dialogOpen, setDialogOpen] = useState(false);

    return (
        <div className="p-6">
        <div className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
            <Button onClick={() => setDialogOpen(true)}>Create Event</Button>
    </div>

    <EventList />
    <CreateEventDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
);
}
```

---

## 6. Implementation Workflow

### Recommended Approach: Use Skills!

**For complete UI generation from slices:**
```bash
# Use the orchestrator skill - it handles everything
/ui-build-slice-ui <slice-file-paths>
```

This will automatically:
1. Analyze slices (`/ui-analyze-slices`)
2. Read UI prompts (`/ui-read-ui-prompts`)
3. Generate types (`/ui-generate-types`)
4. Generate API functions (`/ui-generate-api`)
5. Generate hooks (`/ui-generate-hook`)
6. Scaffold components (`/ui-scaffold-component`)
7. Verify integration

**For individual tasks:**
- **Analyze before coding**: `/ui-analyze-slices <slice-files>` - Understand grouping and dependencies
- **Read requirements**: `/ui-read-ui-prompts <slice-folder>` - Extract design specs and validation rules
- **Generate types only**: `/ui-generate-types <slice-file>` - Create TypeScript interfaces
- **Generate API only**: `/ui-generate-api <slice-file>` - Create Supabase queries or POST commands
- **Generate hook only**: `/ui-generate-hook <slice-file>` - Create React Query hooks
- **Generate component only**: `/ui-scaffold-component <slice-files>` - Create React components with Bulma CSS

### Manual Workflow (If not using skills)

### Step 0: Analyze Grouping
- Find all slices with same `groupId`
- Check `codeGen.uiPrompts` and `ui-prompt.md`
- Plan to implement together

### Step 1: Types
```typescript
// src/types/index.ts
export interface Event {
    event_id: string;
    name: string;
    date: string;
}

export interface CreateEventParams {
    name: string;
    date: string;
}
```

### Step 2: API Functions
- Add endpoints to `src/lib/api-client.ts`
- Implement queries (Supabase) in `src/lib/api.ts`
- Implement commands (POST) in `src/lib/api.ts`

### Step 3: Hooks
- Create query/mutation hooks in `src/hooks/api/use<Entity>.ts`
- Export in `src/hooks/api/index.ts`

### Step 4: Components
- Build list component (STATE_VIEW)
- Build dialog/form components (STATE_CHANGE)
- Compose into page component

---

## 7. Field Type Mapping

| JSON Type | TypeScript | UI Component |
|-----------|-----------|--------------|
| `string` | `string` | `<Input type="text">` |
| `number` | `number` | `<Input type="number">` |
| `date` | `string` | `<Input type="date">` |
| `time` | `string` | `<Input type="time">` |
| `boolean` | `boolean` | `<Switch>` or `<Checkbox>` |

---

## 8. Common Patterns

**Loading**: `if (isLoading) return <Skeleton />;`

**Error Handling**:
```typescript
try {
    await mutation.mutateAsync(params);
    toast.success("Success");
} catch (err) {
    toast.error(`Error: ${err.message}`);
}
```

**Form State**: `const [form, setForm] = useState({ field: "" });`

**Invalidation**: `queryClient.invalidateQueries({ queryKey: ["entity"] });`

---

## 9. UI Components

**NOTE**: The skills in `.claude/skills/` are configured to use **Bulma CSS** for styling. If you're using the skills (especially `/scaffold-component`), components will be generated with Bulma classes.

### Bulma CSS (Used by Skills)

When using skills, components use Bulma classes:
- Layout: `container`, `section`, `columns`, `column`
- Components: `card`, `modal`, `button`, `notification`, `box`
- Forms: `field`, `control`, `label`, `input`, `select`, `textarea`
- Modifiers: `is-primary`, `is-active`, `is-fullwidth`, `has-text-centered`

### shadcn/ui (Alternative)

If manually implementing (not using skills), you can use shadcn/ui components:

Import from `@/components/ui/*`:
- `Button`, `Input`, `Label`, `Textarea`, `Select`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Table`, `Tabs`, `Skeleton`
- `toast` from `sonner`

**Recommendation**: Use the skills with Bulma CSS for consistency with project configuration.

---

## Checklist

**Pre-Implementation**:
- [ ] Check `groupId` - find all related slices
- [ ] Read `ui-prompt.md` and `codeGen.uiPrompts`
- [ ] Identify STATE_VIEW vs STATE_CHANGE slices

**Implementation**:
- [ ] Define types in `src/types/index.ts`
- [ ] Add endpoints to `src/lib/api-client.ts`
- [ ] Implement API functions in `src/lib/api.ts`
- [ ] Create hooks in `src/hooks/api/use<Entity>.ts`
- [ ] Build components in `src/components/<domain>/`
- [ ] Compose page combining all grouped slices
- [ ] Test loading, error handling, success flows

---

## Quick Reference

✅ **Same `groupId`** = Implement together
✅ **STATE_VIEW** = Read table → Query hook → List
✅ **STATE_CHANGE** = Command → Mutation hook → Form/Dialog
✅ **Keep modular** = Sub-components for each slice capability
✅ **Keep simple** = Follow existing patterns, don't over-engineer

---

## 10. Skills Usage Examples

### Example 1: Building Complete UI from Scratch

**User Request**: "Build the UI for the events management slices"

**Your Response**:
```bash
# First, analyze what we're working with
/ui-analyze-slices src/slices/events/*.json

# Then build everything at once
/ui-build-slice-ui src/slices/events/ViewEvents.json src/slices/events/CreateEvent.json
```

### Example 2: Just Need to Understand Slices

**User Request**: "What slices are in the orders group?"

**Your Response**:
```bash
# Use ui-analyze-slices to understand the grouping
/ui-analyze-slices src/slices/orders/*.json
```

### Example 3: Regenerating Just Types

**User Request**: "The Event interface is wrong, regenerate it from the slice"

**Your Response**:
```bash
# Use ui-generate-types to recreate just the TypeScript interfaces
/ui-generate-types src/slices/events/ViewEvents.json
```

### Example 4: Adding New API Endpoint

**User Request**: "Add the API function for the CancelEvent command"

**Your Response**:
```bash
# Use ui-generate-api to create the API layer
/ui-generate-api src/slices/events/CancelEvent.json
```

### Example 5: Understanding UI Requirements

**User Request**: "What are the validation rules for the event form?"

**Your Response**:
```bash
# Use ui-read-ui-prompts to extract requirements
/ui-read-ui-prompts src/slices/events/
```

### Example 6: Fixing Component Styling

**User Request**: "The EventList component doesn't look right, regenerate it with proper Bulma styling"

**Your Response**:
```bash
# Use ui-scaffold-component to regenerate with Bulma CSS
/ui-scaffold-component src/slices/events/ViewEvents.json
```

### Decision Tree: Which Skill to Use?

```
Need to build complete UI from slices?
  └─> /ui-build-slice-ui (orchestrates everything)

Just exploring/understanding?
  └─> /ui-analyze-slices (analysis only)

Just need to understand UI requirements?
  └─> /ui-read-ui-prompts (extract specs)

Need to fix/regenerate specific layer?
  ├─> Types wrong? → /ui-generate-types
  ├─> API functions wrong? → /ui-generate-api
  ├─> Hooks wrong? → /ui-generate-hook
  └─> Components wrong? → /ui-scaffold-component

Don't know which skill to use?
  └─> Start with /ui-analyze-slices, then use /ui-build-slice-ui
```

---

## Remember

**ALWAYS** prefer using the skills over manual implementation! They ensure:
- Consistency across the codebase
- Proper use of Bulma CSS
- Correct CQRS patterns
- Proper TypeScript types
- React Query best practices
- Adherence to UI prompts and validation rules
