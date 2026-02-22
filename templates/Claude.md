# Project Configuration

This file contains project-specific instructions for Claude Code.

## Event Model Structure

Read event models (JSON files) to understand the domain structure.

Event models typically define:
- **Commands**: Actions that can be performed
- **Events**: Facts that happened
- **Aggregates**: Domain entities that commands act upon
- **Read Models**: Query-optimized views
- **Processors**: Background automations

## Framework & Technology Stack

- **Language**: TypeScript only
- **Module System**: Use ES modules (import/export)
- **Type Safety**: Ensure all code is properly typed
- **Testing**: Use node:test with given/when/then pattern

## File Structure Constraints

- **Slice Organization**: Each feature/domain should be organized as a separate slice
- **Path Convention**: `src/slices/{SliceName}/`
- Each slice should be self-contained and focused on a specific domain

## Code Standards

### Naming Conventions
- Files: PascalCase for slice files (e.g., `RegisterClerk.ts`)
- Variables: camelCase
- Types: PascalCase
- Constants: UPPER_SNAKE_CASE

### Module Organization
```
src/slices/{SliceName}/
├── {SliceName}Command.ts  # State-change logic (if applicable)
├── {SliceName}Projection.ts # State-view logic (if applicable)
├── processor.ts            # Automation logic (if applicable)
├── routes.ts               # HTTP API endpoints
├── {SliceName}.test.ts     # Tests
└── ui/                     # UI components (optional)
```

## Development Guidelines

1. Each slice should be self-contained and focused on a specific domain
2. Maintain clear separation of concerns within each slice
3. Follow TypeScript best practices for type definitions and interfaces
4. Write tests for all business logic
5. Document complex business rules

## Event Sourcing Patterns

### Commands (State-Change)
- Commands express intent: "RegisterClerk", "ActivateShift"
- Validate in `decide()` function
- Reconstruct state in `evolve()` function
- Emit events as results

### Events
- Events are facts: "ClerkRegistered", "ShiftActivated"
- Use past tense
- Include all data needed to reconstruct state
- Events are immutable

### Read Models (State-View)
- Build from events in projections
- Optimize for queries
- Can be rebuilt from event stream

### Automations
- Run on CRON schedules
- Read from TODO lists (work queues)
- Fire commands automatically
- Handle errors gracefully

## Testing Guidelines

### Test Pattern
Use given/when/then pattern:
```typescript
given([/* precondition events */])
  .when(command)
  .then([/* expected events */])
```

### Test Coverage
- Happy path scenarios
- Error cases
- Edge cases
- Business rule validations

## After Completing Work

After you are done implementing a slice:
1. **Run tests**: Ensure all tests pass
2. **Run build**: Ensure TypeScript compiles
3. **Update AGENTS.md**: Add learnings for future iterations
4. **Update progress.txt**: Document what was done

## Additional Notes

Add project-specific guidelines, conventions, and patterns here as your project evolves.
