"use strict";
// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Andrey Limachko <liannnix@giran.cyou>
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = sendNotification;
async function sendNotification(opts) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
        const response = await fetch(`${opts.server}/${opts.topic}`, {
            method: "POST",
            body: opts.message,
            headers: {
                "X-Title": opts.title,
                "X-Priority": String(opts.priority ?? 3),
                "X-Tags": (opts.tags ?? []).join(","),
            },
            signal: controller.signal,
        });
        if (!response.ok) {
            console.warn("[opencode-ntfy] ntfy server returned non-2xx status:", response.status);
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn("[opencode-ntfy] Failed to send notification:", message);
    }
    finally {
        clearTimeout(timeout);
    }
}
//# sourceMappingURL=notify.js.map