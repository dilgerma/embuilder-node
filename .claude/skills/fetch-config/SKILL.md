---
name: fetch-config
description: Start server to receive config.json from event model app
---

# Receive Config from Event Model App

Start a temporary HTTP server to receive configuration from the event model application.

## Task

You are tasked with starting a temporary HTTP server that accepts a config.json payload and saves it locally.

## Steps

1. Check if a config.json already exists in the current directory
   - If it exists, inform the user it will be overwritten when new config is received

2. Create and start a simple HTTP server that:
   - Listens on port 3001
   - Accepts POST requests to `/config`
   - Expects JSON in the request body
   - Validates that the body is valid JSON
   - Writes the JSON to `config.json` in the current directory
   - Responds with success/error status
   - Automatically shuts down after successfully receiving the config

3. Inform the user:
   ```
   Server listening on http://localhost:3001
   Waiting for config from event model app...

   Tell your event model app to POST to: http://localhost:3001/config
   ```

4. Wait for the request (server will automatically close after receiving it)

5. After receiving the config:
   - Confirm the file was saved successfully
   - Show a preview of the saved config (first 30 lines or summary of key sections)
   - List the available slices that can be generated
   - Inform the user they can now use generator commands:
     - `/gen-skeleton` - Generate backend skeleton
     - `/gen-state-change` - Generate state change slices
     - `/gen-state-view` - Generate state view slices
     - `/gen-automation` - Generate automation slices

## Implementation

Use the provided server script located at `.claude/skills/fetch-config/receive-config.js`:

```bash
node .claude/skills/fetch-config/receive-config.js
```

The server script will:
- Start listening on port 3001
- Accept POST requests to `/config`
- Save received JSON to `config.json`
- Automatically shut down after receiving the config

You can also run it directly if it's executable:
```bash
.claude/skills/fetch-config/receive-config.js
```

## Important Notes

- Server listens on port 3001
- Only accepts POST requests to `/config` endpoint
- Validates JSON before saving
- Includes CORS headers for browser-based requests
- Automatically shuts down after successfully receiving config
- Overwrites existing `config.json` without prompting (user was already informed)
