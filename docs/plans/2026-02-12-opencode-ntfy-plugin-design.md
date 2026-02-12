# opencode-ntfy plugin design

## Purpose

An opencode plugin that sends push notifications via the ntfy API when tasks complete or errors occur. Lets users step away from the terminal and get notified on their phone/desktop when opencode finishes working.

## Events

The plugin subscribes to two opencode events through the `event` hook:

- **`session.idle`** -- task completed, LLM waiting for input. Priority: default (3). Tags: `white_check_mark`.
- **`session.error`** -- session error occurred. Priority: high (4). Tags: `x`.

## Configuration

The plugin reads `.opencode-ntfy.json` from the project root (`directory` from PluginInput):

```json
{
  "server": "https://ntfy.sh",
  "topic": "my-opencode-notifications",
  "events": ["session.idle", "session.error"]
}
```

| Field    | Required | Default                              | Description              |
|----------|----------|--------------------------------------|--------------------------|
| `server` | no       | `https://ntfy.sh`                    | ntfy server URL          |
| `topic`  | yes      | --                                   | ntfy topic name          |
| `events` | no       | `["session.idle", "session.error"]`  | events to subscribe to   |

If the config file is missing or `topic` is not set, the plugin logs a warning and does nothing. It never crashes opencode.

## Project structure

```
opencode-ntfy/
  src/
    index.ts      # Plugin entry point, exports Plugin function
    config.ts     # Config file reading and validation
    notify.ts     # ntfy HTTP API call
  package.json
  tsconfig.json
```

Published as an npm package. Users add it to `opencode.json`:

```json
{
  "plugin": ["opencode-ntfy"]
}
```

## Plugin entry point (`index.ts`)

The plugin exports a function that:

1. Reads config from `.opencode-ntfy.json` in `directory`.
2. If config is invalid (no topic), logs a warning and returns empty hooks.
3. Returns an `event` hook that filters events by `config.events` and calls `sendNotification`.

```ts
import { type Plugin } from "@opencode-ai/plugin"

export const plugin: Plugin = async ({ project, directory }) => {
  const config = loadConfig(directory)
  if (!config) {
    console.warn("[opencode-ntfy] No valid config found, plugin disabled")
    return {}
  }

  return {
    event: async ({ event }) => {
      if (!config.events.includes(event.type)) return

      if (event.type === "session.idle") {
        await sendNotification({
          server: config.server,
          topic: config.topic,
          title: "opencode: task complete",
          message: `Project: ${project} | Session: ${event.properties.sessionID}`,
          priority: 3,
          tags: ["white_check_mark"],
        })
      }

      if (event.type === "session.error") {
        const error = event.properties.error
        const errorType = error ? error.type || "unknown" : "unknown"
        await sendNotification({
          server: config.server,
          topic: config.topic,
          title: "opencode: error",
          message: `Project: ${project} | Session: ${event.properties.sessionID || "n/a"} | Error: ${errorType}`,
          priority: 4,
          tags: ["x"],
        })
      }
    },
  }
}
```

## Notification sending (`notify.ts`)

Single function, no dependencies. Uses built-in `fetch` with a 5-second timeout via `AbortController`.

```ts
async function sendNotification(opts: {
  server: string
  topic: string
  title: string
  message: string
  priority?: number
  tags?: string[]
}): Promise<void> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)

  try {
    await fetch(`${opts.server}/${opts.topic}`, {
      method: "POST",
      body: opts.message,
      headers: {
        "X-Title": opts.title,
        "X-Priority": String(opts.priority ?? 3),
        "X-Tags": (opts.tags ?? []).join(","),
      },
      signal: controller.signal,
    })
  } catch (err) {
    console.warn("[opencode-ntfy] Failed to send notification:", err)
  } finally {
    clearTimeout(timeout)
  }
}
```

All errors are caught and logged. The plugin never throws.

## Config loading (`config.ts`)

Reads and validates `.opencode-ntfy.json`. Returns `null` if the file is missing or invalid.

```ts
interface NtfyConfig {
  server: string
  topic: string
  events: string[]
}

function loadConfig(directory: string): NtfyConfig | null {
  // Read .opencode-ntfy.json from directory
  // Validate: topic is required
  // Apply defaults: server = "https://ntfy.sh", events = ["session.idle", "session.error"]
  // Return null on any error
}
```

## Error handling

- Config missing/invalid: warn, disable plugin, return empty hooks.
- Network error on send: warn, swallow exception.
- ntfy returns non-2xx: warn, swallow.
- The plugin must never throw unhandled exceptions or break opencode.

## Notification format

### session.idle

```
POST https://ntfy.sh/{topic}
X-Title: opencode: task complete
X-Priority: 3
X-Tags: white_check_mark

Project: my-project | Session: abc123
```

### session.error

```
POST https://ntfy.sh/{topic}
X-Title: opencode: error
X-Priority: 4
X-Tags: x

Project: my-project | Session: abc123 | Error: ProviderAuthError
```

## Testing

- **Unit: `config.ts`** -- valid config, missing file, missing topic, defaults applied.
- **Unit: `notify.ts`** -- mock `fetch`, verify headers/body/priority, verify timeout, verify error swallowing.
- **Integration: `index.ts`** -- mock event + fetch, verify correct notification sent for each event type, verify ignored events are skipped.

Runtime: `bun test`.

## Future considerations (not in scope)

- Authentication (Bearer token, Basic auth) for protected ntfy topics.
- Custom message templates.
- Rate limiting / deduplication.
- Additional events (message.updated, tool.execute.after, etc.).
