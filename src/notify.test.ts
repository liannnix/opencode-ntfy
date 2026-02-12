// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Andrey Limachko <liannnix@giran.cyou>

import { describe, it, expect, beforeEach, afterEach, vi } from "bun:test"
import { sendNotification } from "./notify"

describe("sendNotification", () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    globalThis.fetch = fetchMock as unknown as typeof fetch
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("sends POST request to ntfy server with correct headers", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })

    await sendNotification({
      server: "https://ntfy.sh",
      topic: "my-topic",
      title: "test title",
      message: "test message",
      priority: 4,
      tags: ["tag1", "tag2"],
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("https://ntfy.sh/my-topic", {
      method: "POST",
      body: "test message",
      headers: {
        "X-Title": "test title",
        "X-Priority": "4",
        "X-Tags": "tag1,tag2",
      },
      signal: expect.any(AbortSignal),
    })
  })

  it("uses default priority 3 when not specified", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, status: 200 })

    await sendNotification({
      server: "https://ntfy.sh",
      topic: "my-topic",
      title: "test title",
      message: "test message",
    })

    expect(fetchMock).toHaveBeenCalledWith("https://ntfy.sh/my-topic", {
      method: "POST",
      body: "test message",
      headers: {
        "X-Title": "test title",
        "X-Priority": "3",
        "X-Tags": "",
      },
      signal: expect.any(AbortSignal),
    })
  })

  it("does not throw on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network error"))

    const consoleWarn = vi.spyOn(console, "warn").mockReturnValue()

    await expect(
      async () =>
        await sendNotification({
          server: "https://ntfy.sh",
          topic: "my-topic",
          title: "test title",
          message: "test message",
        })
    ).not.toThrow()

    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  it("does not throw when fetch returns non-2xx status", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500 })

    const consoleWarn = vi.spyOn(console, "warn").mockReturnValue()

    await expect(
      async () =>
        await sendNotification({
          server: "https://ntfy.sh",
          topic: "my-topic",
          title: "test title",
          message: "test message",
        })
    ).not.toThrow()

    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })

  it.skip("aborts on slow fetch", async () => {
    fetchMock.mockImplementation(
      async () => {
        await new Promise((r) => setTimeout(r, 6000))
        return { ok: true, status: 200 }
      }
    )

    const consoleWarn = vi.spyOn(console, "warn").mockReturnValue()

    await sendNotification({
      server: "https://ntfy.sh",
      topic: "my-topic",
      title: "test title",
      message: "test message",
    })

    expect(consoleWarn).toHaveBeenCalled()
    consoleWarn.mockRestore()
  })
})
