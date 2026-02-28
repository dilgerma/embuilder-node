---
skill_name: ui-read-ui-prompts
description: Find and parse UI prompts from slice definitions and related files
version: 1.0.0
author: Frontend Development Team
tags: [ui, prompts, requirements, design, validation]
---

# UI Prompt Reader Skill

Find and parse UI prompts from slice definitions and related files.

## Instructions

You will be provided with:
- Slice JSON file path
- Slice folder path (e.g., `/backend/src/slices/<slice name>/`)

Your task is to:

1. **Read the slice JSON file** to extract:
   - `codeGen.uiPrompts` array (if present)
   - Any UI-related metadata in the slice definition

2. **Check for `ui-prompt.md`** in the slice folder:
   - Read the file if it exists
   - Parse its content for design requirements, validation rules, and UX flows

3. **Extract and organize UI requirements**:
   - Design specifications (layout, styling, format)
   - Validation rules (required fields, formats, constraints)
   - UX flow instructions (user journey, interactions)
   - Accessibility requirements
   - Error handling specifications

4. **Provide structured output** that can guide component implementation

## UI Prompt Structure

UI prompts typically contain:

### Design Specifications
- Layout preferences (grid, cards, table, list)
- Styling guidelines (colors, spacing, typography)
- Format requirements (date formats, number formats)
- Responsive design considerations

### Validation Rules
- Required fields
- Field length constraints (min/max)
- Value constraints (min/max values, ranges)
- Format validations (email, phone, URL, patterns)
- Cross-field validations (end date > start date)

### UX Flow
- User journey steps
- Interaction patterns (click → open dialog → fill form → submit → refresh)
- Success/error feedback (toasts, notifications, messages)
- Loading states
- Empty states

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

## Output Format

Provide a structured summary:

```
# UI Prompts Analysis

## Source: {slice name}

### From codeGen.uiPrompts:
1. "{prompt text}"
2. "{prompt text}"

### From ui-prompt.md:

#### Design Specifications:
- Layout: {description}
- Styling: {description}
- Formats: {description}

#### Validation Rules:
| Field | Rule | Message |
|-------|------|---------|
| {field} | {rule} | {error message} |

#### UX Flow:
1. {step}
2. {step}
3. {step}

#### Special Requirements:
- {requirement}
- {requirement}

### Implementation Guidance:

Based on the prompts, the implementation should:
1. {specific action based on prompt}
2. {specific action based on prompt}

### Code Snippets:

{Any specific code patterns or examples from the prompts}
```

## Example

For an events management slice with ui-prompt.md:

```markdown
# Events Management UI

## Design
- Use card layout for event list
- Display date in DD.MM.YYYY format
- Show time in 24-hour format (HH:mm)
- Use responsive 3-column grid on desktop, 1-column on mobile

## Validation
- Name: Required, max 100 characters
- Date: Required, cannot be in the past
- Start time: Required
- End time: Required, must be after start time
- Persons: Required, must be > 0

## UX Flow
1. User clicks "Create Event" button
2. Modal dialog opens with form
3. User fills form fields
4. On submit, show loading state
5. On success, close dialog and show success toast
6. Refresh event list automatically
7. On error, show error message in dialog
```

Your output would be:

```
# UI Prompts Analysis

## Source: Events Management

### From ui-prompt.md:

#### Design Specifications:
- Layout: Card layout for event list with 3-column grid (desktop) / 1-column (mobile)
- Date Format: DD.MM.YYYY
- Time Format: 24-hour format (HH:mm)
- Component: Use Bulma cards and columns

#### Validation Rules:
| Field | Rule | Message |
|-------|------|---------|
| name | Required, max 100 chars | "Name is required (max 100 characters)" |
| date | Required, not in past | "Date cannot be in the past" |
| start_time | Required | "Start time is required" |
| end_time | Required, > start_time | "End time must be after start time" |
| persons | Required, > 0 | "Number of persons must be positive" |

#### UX Flow:
1. Click "Create Event" button
2. Modal dialog opens with form
3. Fill form fields with validation
4. Submit → Loading state
5. Success → Close dialog + Success toast + Refresh list
6. Error → Show error in dialog

### Implementation Guidance:

1. Use Bulma modal with `is-active` class for dialog
2. Implement date formatting with `toLocaleDateString('de-DE')`
3. Add form validation before submit
4. Use `useMutation` onSuccess callback for toast and list refresh
5. Implement responsive grid with `columns is-multiline` and `column is-one-third`
6. Add cross-field validation for start/end time comparison
```

## Notes

- If no `ui-prompt.md` exists, rely solely on `codeGen.uiPrompts`
- If no UI prompts are found, provide general best practices
- Extract specific implementation details (formats, layouts, validations)
- Translate requirements into actionable coding tasks
- Identify any custom components or patterns needed
- Note any conflicts between prompts and suggest resolutions
