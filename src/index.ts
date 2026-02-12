// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Andrey Limachko <liannnix@giran.cyou>

import type { Plugin, PluginInput } from "@opencode-ai/plugin"
import { loadConfig } from "./config.js"
import { sendNotification } from "./notify.js"

export const plugin: Plugin = async (input: PluginInput) => {
  const { project, directory } = input

  const config = loadConfig(directory ?? ".")
  if (!config) {
    console.warn("[opencode-ntfy] No valid config found, plugin disabled")
    return {}
  }

  if (!config.topic) {
    console.warn("[opencode-ntfy] Topic is required in config, plugin disabled")
    return {}
  }

  const projectName = project.id || project.worktree || "unknown"

  return {
    event: async ({ event }) => {
      if (!config.events.includes(event.type)) {
        return
      }

      if (event.type === "session.idle") {
        const sessionID = event.properties.sessionID ?? "unknown"
        await sendNotification({
          server: config.server,
          topic: config.topic,
          title: "opencode: task complete",
          message: `Project: ${projectName} | Session: ${sessionID}`,
          priority: 3,
          tags: ["white_check_mark"],
        })
      }

      if (event.type === "session.error") {
        const sessionID = event.properties.sessionID ?? "n/a"
        const error = event.properties.error
        const errorType = error && typeof error === "object" && "type" in error
          ? String(error.type)
          : "unknown"
        await sendNotification({
          server: config.server,
          topic: config.topic,
          title: "opencode: error",
          message: `Project: ${projectName} | Session: ${sessionID} | Error: ${errorType}`,
          priority: 4,
          tags: ["x"],
        })
      }
    },
  }
}
