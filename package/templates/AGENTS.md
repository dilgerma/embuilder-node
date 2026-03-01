# Agent Learnings

This file captures patterns, gotchas, and best practices discovered during development.
Update this file as you learn new patterns that future iterations should know.

## Core Principles

### Event Model as Source of Truth
- Event model JSON files define the desired state
- Code must match the event model specification
- When in doubt, check the event model

### File Organization
- Each slice lives in `src/slices/{SliceName}/`
- Keep slices self-contained and focused
- Follow consistent naming conventions

## Event-Driven Architecture Patterns

### State-Change Slices (Commands)
- Use `decide()` for business logic validation
- Use `evolve()` for state reconstruction from events
- State should only track what's needed for validation
- Simple commands can have empty state `{}`

### State-View Slices (Queries)
- Projections build read models from events
- Read models are optimized for querying
- One read model per use case/view

### Automation Slices
- Automations = State-Change + CRON processor
- Read from TODO list (work queue) read models
- Process one item at a time with `.limit(1)`
- Always wrap command execution in try-catch

## Common Patterns

### Stream IDs
- Use consistent stream ID patterns per aggregate
- Format: `{aggregate}-{id}` or `{context}-{aggregate}-{id}`
- Document stream ID patterns in each slice

### Metadata
- Always include `correlation_id` and `causation_id`
- Use optional chaining: `metadata?.field`
- Include tenant/user IDs for multi-tenancy

### Testing
- Use `DeciderSpecification.for()` for state-change tests
- Use `PostgreSQLProjectionSpec.for()` for state-view tests
- Test format: given/when/then
- Include both happy path and error scenarios

## Database Patterns

### Migrations
- Never modify existing migrations
- Always create new migrations for changes
- Use sequential version numbers (V1, V2, V3...)
- Check latest migration before creating new one

### Tables
- Use snake_case for table and column names
- Include proper indexes for query performance
- Add tenant ID columns for multi-tenancy

## TypeScript Best Practices

### Types
- Use strict TypeScript mode
- Define explicit types for commands, events, and state
- Avoid `any` - use `unknown` if needed

### Imports
- Use ES modules (import/export)
- Organize imports: external, internal, types
- Keep imports minimal and specific

## Error Handling

### Validation Errors
- Throw descriptive error messages
- Use error codes for common failures
- Map errors to user-friendly messages in routes

### HTTP Status Codes
- 200: Success
- 400: Bad request (validation error)
- 401: Unauthorized
- 409: Conflict (business rule violation)
- 500: Server error

## Code Quality

### Before Committing
- Run `npm run build` - ensure TypeScript compiles
- Run `npm run test` - ensure all tests pass
- Update this file with new learnings
- Update progress.txt with iteration summary

### Clean Code
- Follow existing patterns in codebase
- Keep functions focused and small
- Use descriptive names for variables and functions
- Comment complex business logic

## Future Development Notes

Add your learnings here as you discover patterns specific to your domain and architecture.
