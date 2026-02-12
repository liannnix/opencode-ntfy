# opencode-ntfy

[OpenCode](https://github.com/sst/opencode) plugin that sends push notifications via [ntfy](https://ntfy.sh) when tasks complete or errors occur.

## Install

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-ntfy"]
}
```

## Configure

Create `.opencode-ntfy.json` in your project root:

```json
{
  "topic": "my-opencode-notifications"
}
```

| Field    | Required | Default                              | Description            |
|----------|----------|--------------------------------------|------------------------|
| `topic`  | yes      | --                                   | ntfy topic name        |
| `server` | no       | `https://ntfy.sh`                    | ntfy server URL        |
| `events` | no       | `["session.idle", "session.error"]`  | events to notify about |

### Self-hosted ntfy

```json
{
  "server": "https://ntfy.example.com",
  "topic": "my-topic"
}
```

### Only error notifications

```json
{
  "topic": "my-topic",
  "events": ["session.error"]
}
```

## Events

| Event           | Title                    | Priority       |
|-----------------|--------------------------|----------------|
| `session.idle`  | `opencode: task complete` | 3 (default)    |
| `session.error` | `opencode: error`        | 4 (high)       |

## Receiving notifications

Subscribe to your topic with any ntfy client:

- **Phone**: [ntfy Android](https://play.google.com/store/apps/details?id=io.heckel.ntfy) / [iOS](https://apps.apple.com/app/ntfy/id1625396347)
- **Desktop**: `curl -s ntfy.sh/my-topic/sse`
- **Browser**: `https://ntfy.sh/my-topic`

## License

GPL-3.0-or-later
