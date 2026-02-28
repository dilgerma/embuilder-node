# Frontend Agent Prompt - UI Component Generation

Build React + TypeScript UI components from slice JSON definitions using established patterns.

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

1. Check `ui-prompt.md` (detailed specs)
2. Check `codeGen.uiPrompts` array (high-level guidance)
3. Follow this prompt (standard patterns)
4. Keep it simple if no guidance

---

## 2. Authentication & API Context

```typescript
// AuthContext: user, session, restaurantId
import { useAuth } from "@/contexts/AuthContext";
const { user, session, restaurantId } = useAuth();

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
      toast.success("Created");
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

## 9. UI Components (shadcn/ui)

Import from `@/components/ui/*`:
- `Button`, `Input`, `Label`, `Textarea`, `Select`
- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`
- `Table`, `Tabs`, `Skeleton`
- `toast` from `sonner`

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
