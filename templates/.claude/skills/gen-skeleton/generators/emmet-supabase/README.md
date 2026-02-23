# Emmet Supabase Generator

A Yeoman generator for creating Supabase-based applications with event modeling architecture.

## Prerequisites

- A `config.json` file in your project directory defining your slices and application configuration

## Usage

The generator supports both **interactive mode** (with prompts) and **non-interactive mode** (with command-line arguments).

### Interactive Mode

Run the generator without arguments to be prompted for your choices:

```bash
yo emmet-supabase
```

You'll be asked:
1. What to generate (Skeleton App, State Change Slice, State View Slice, or Automation Slice)
2. Additional details based on your selection

### Non-Interactive Mode

Provide command-line options to run without prompts:

#### Generate a Skeleton App

```bash
yo emmet-supabase --action skeleton --app-name my-project
```

Options:
- `--action` or `-a`: Set to `skeleton`
- `--app-name` or `-n`: Project name (optional, defaults to value in config.json or 'my-app')

#### Generate State Change Slices

```bash
yo emmet-supabase --action STATE_CHANGE --slices slice-id-1,slice-id-2
```

Options:
- `--action` or `-a`: Set to `STATE_CHANGE`
- `--slices` or `-s`: Comma-separated list of slice IDs from your config.json (required)

#### Generate State View Slices

```bash
yo emmet-supabase --action STATE_VIEW --slices slice-id-1,slice-id-2
```

Options:
- `--action` or `-a`: Set to `STATE_VIEW`
- `--slices` or `-s`: Comma-separated list of slice IDs from your config.json (required)

#### Generate Automation Slices

```bash
yo emmet-supabase --action AUTOMATION --slices slice-id-1
```

Options:
- `--action` or `-a`: Set to `AUTOMATION`
- `--slices` or `-s`: Comma-separated list of slice IDs from your config.json (required)

## Command-Line Options Reference

| Option | Alias | Description | Required |
|--------|-------|-------------|----------|
| `--action` | `-a` | What to generate: `skeleton`, `STATE_CHANGE`, `STATE_VIEW`, or `AUTOMATION` | No (prompts if not provided) |
| `--app-name` | `-n` | Project name (for skeleton generation) | No (uses config or default) |
| `--slices` | `-s` | Comma-separated slice IDs to generate | Yes (when action is not skeleton) |

## Examples

### Interactive Mode Examples

```bash
# Start interactive mode
yo emmet-supabase
```

### Non-Interactive Mode Examples

```bash
# Generate a skeleton with default name
yo emmet-supabase --action skeleton

# Generate a skeleton with custom name
yo emmet-supabase -a skeleton -n my-awesome-app

# Generate multiple state change slices
yo emmet-supabase -a STATE_CHANGE -s add-location,update-location

# Generate a single state view slice
yo emmet-supabase --action STATE_VIEW --slices locations-view

# Generate automation slices
yo emmet-supabase -a AUTOMATION -s process-orders,send-notifications
```

## Config.json Structure

Your `config.json` should define slices with the following structure:

```json
{
  "codeGen": {
    "application": "my-default-app-name"
  },
  "slices": [
    {
      "id": "add-location",
      "title": "Add Location",
      "sliceType": "STATE_CHANGE",
      "commands": [...],
      "events": [...]
    },
    {
      "id": "locations-view",
      "title": "Locations",
      "sliceType": "STATE_VIEW",
      "readModels": [...],
      "events": [...]
    }
  ]
}
```

## Notes

- The generator requires a valid `config.json` in your current working directory
- In non-interactive mode, slice IDs must exactly match those defined in your config.json
- The generator will validate your inputs and provide clear error messages for invalid configurations
