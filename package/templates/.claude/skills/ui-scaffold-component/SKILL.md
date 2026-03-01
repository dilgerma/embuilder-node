---
skill_name: ui-scaffold-component
description: Scaffold React components (List, Dialog, Page) from slice definitions using Bulma CSS
version: 1.0.0
author: Frontend Development Team
tags: [ui, components, react, bulma, scaffolding]
---

# Component Scaffolder Skill

Scaffold React components (List, Dialog, Page) from slice definitions using Bulma CSS.

## Instructions

You will be provided with:
- Slice JSON file paths (one or more in the same group)
- Component type to scaffold (List, Dialog, Page, or Auto)
- Domain/entity name

Your task is to:

1. **Read all slice JSON files** to understand:
   - Fields and their types
   - Which slices are STATE_VIEW (for lists)
   - Which slices are STATE_CHANGE (for forms/dialogs)
   - UI prompts from `codeGen.uiPrompts`

2. **Scaffold appropriate components**:
   - **List Component**: For STATE_VIEW slices (displays data in cards/table)
   - **Dialog Component**: For STATE_CHANGE slices (forms for create/update)
   - **Page Component**: Combines list and dialogs into a complete page

3. **Use Bulma CSS exclusively** for all styling:
   - Layout: `columns`, `column`, `container`, `section`
   - Components: `card`, `button`, `modal`, `box`, `table`
   - Form elements: `field`, `control`, `label`, `input`, `select`, `textarea`
   - Utilities: `is-primary`, `is-fullwidth`, `has-text-centered`, etc.

4. **Integrate generated hooks**:
   - Import and use query hooks in list components
   - Import and use mutation hooks in dialog components
   - Handle loading and error states

## Component Templates

### List Component (for STATE_VIEW)

```typescript
import React from 'react';
import { use{Entity} } from '@/hooks/api';
import type { {Entity} } from '@/types';

export function {Entity}List() {
  const { data: {entities}, isLoading, error } = use{Entity}();

  if (isLoading) {
    return <div className="has-text-centered p-6">Loading...</div>;
  }

  if (error) {
    return (
      <div className="notification is-danger">
        Error loading {entities}: {error.message}
      </div>
    );
  }

  if (!{entities} || {entities}.length === 0) {
    return (
      <div className="notification is-info">
        No {entities} found.
      </div>
    );
  }

  return (
    <div className="columns is-multiline">
      {{entities}.map(({entity}) => (
        <div key={{entity}.id} className="column is-one-third">
          <div className="card">
            <div className="card-content">
              <p className="title is-5">{{entity}.name}</p>
              {/* Add more fields based on slice definition */}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Dialog Component (for STATE_CHANGE)

```typescript
import React, { useState } from 'react';
import { use{Action}{Entity} } from '@/hooks/api';
import type { {Action}{Entity}Params } from '@/types';

interface {Action}{Entity}DialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function {Action}{Entity}Dialog({ isOpen, onClose }: {Action}{Entity}DialogProps) {
  const { mutate: {actionCamelCase}{Entity}, isPending } = use{Action}{Entity}();
  const [formData, setFormData] = useState<{Action}{Entity}Params>({
    // Initialize with default values based on slice fields
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    {actionCamelCase}{Entity}(formData, {
      onSuccess: () => {
        onClose();
        // Reset form or show success message
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className={`modal ${isOpen ? 'is-active' : ''}`}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{Action} {Entity}</p>
          <button className="delete" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          <form onSubmit={handleSubmit}>
            {/* Generate form fields based on slice definition */}
            <div className="field">
              <label className="label">Field Name</label>
              <div className="control">
                <input
                  className="input"
                  type="text"
                  value={formData.fieldName}
                  onChange={(e) => setFormData({ ...formData, fieldName: e.target.value })}
                  required
                />
              </div>
            </div>
          </form>
        </section>
        <footer className="modal-card-foot">
          <button
            className="button is-primary"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? 'Saving...' : 'Save'}
          </button>
          <button className="button" onClick={onClose}>
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
}
```

### Page Component (Composition)

```typescript
import React, { useState } from 'react';
import { {Entity}List } from './{Entity}List';
import { Create{Entity}Dialog } from './Create{Entity}Dialog';

export function {Entity}Page() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="container">
      <section className="section">
        <div className="level">
          <div className="level-left">
            <div className="level-item">
              <h1 className="title">{Entities}</h1>
            </div>
          </div>
          <div className="level-right">
            <div className="level-item">
              <button
                className="button is-primary"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                Create {Entity}
              </button>
            </div>
          </div>
        </div>

        <{Entity}List />

        <Create{Entity}Dialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
        />
      </section>
    </div>
  );
}
```

## Form Field Generation

Based on field types in slice JSON, generate appropriate form inputs:

- **String**: `<input className="input" type="text" />`
- **Number**: `<input className="input" type="number" />`
- **Date**: `<input className="input" type="date" />`
- **Time**: `<input className="input" type="time" />`
- **Boolean**: `<input type="checkbox" className="checkbox" />`
- **Enum/Select**: `<div className="select"><select>...</select></div>`
- **Textarea**: `<textarea className="textarea" />`

## Output Format

Provide:

1. **Component files** with full paths
2. **Import statements** needed
3. **Integration notes** for adding to routes or parent components

Example:

```
# Components Scaffolded

## File: src/components/events/EventList.tsx

[Component code]

## File: src/components/events/CreateEventDialog.tsx

[Component code]

## File: src/components/events/EventsPage.tsx

[Component code]

## Integration

Add to routes:
import { EventsPage } from '@/components/events/EventsPage';

// In router configuration:
{ path: '/events', element: <EventsPage /> }
```

## Bulma CSS Guidelines

- Use `columns` and `column` for responsive grid layouts
- Use `card` for displaying entity items
- Use `modal` for dialogs (add `is-active` class when open)
- Use `button is-primary` for primary actions
- Use `notification` for messages (with `is-danger`, `is-info`, etc.)
- Use `field`, `control`, `label`, `input` for forms
- Use `level` for horizontal layouts with items on left/right
- Use `section` and `container` for page layout

## Notes

- Always create components in `src/components/{domain}/` directory
- Use TypeScript with proper types imported from `@/types`
- Include loading and error states
- Handle form validation based on required fields
- Close dialogs on successful mutations
- Use semantic HTML elements
- Follow React best practices (controlled components, proper event handling)
