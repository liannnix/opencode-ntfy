"use strict";
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Andrey Limachko <liannnix@giran.cyou>
Object.defineProperty(exports, "__esModule", { value: true });
exports.plugin = void 0;
const config_js_1 = require("./config.js");
const notify_js_1 = require("./notify.js");
const plugin = async (input) => {
    const { project, directory } = input;
    const config = (0, config_js_1.loadConfig)(directory ?? ".");
    if (!config) {
        console.warn("[opencode-ntfy] No valid config found, plugin disabled");
        return {};
    }
    if (!config.topic) {
        console.warn("[opencode-ntfy] Topic is required in config, plugin disabled");
        return {};
    }
    const projectName = project.id || project.worktree || "unknown";
    return {
        event: async ({ event }) => {
            if (!config.events.includes(event.type)) {
                return;
            }
            if (event.type === "session.idle") {
                const sessionID = event.properties.sessionID ?? "unknown";
                await (0, notify_js_1.sendNotification)({
                    server: config.server,
                    topic: config.topic,
                    title: "opencode: task complete",
                    message: `Project: ${projectName} | Session: ${sessionID}`,
                    priority: 3,
                    tags: ["white_check_mark"],
                });
            }
            if (event.type === "session.error") {
                const sessionID = event.properties.sessionID ?? "n/a";
                const error = event.properties.error;
                const errorType = error && typeof error === "object" && "type" in error
                    ? String(error.type)
                    : "unknown";
                await (0, notify_js_1.sendNotification)({
                    server: config.server,
                    topic: config.topic,
                    title: "opencode: error",
                    message: `Project: ${projectName} | Session: ${sessionID} | Error: ${errorType}`,
                    priority: 4,
                    tags: ["x"],
                });
            }
        },
    };
};
exports.plugin = plugin;
//# sourceMappingURL=index.js.map