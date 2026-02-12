// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Andrey Limachko <liannnix@giran.cyou>

import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { mkdtempSync, writeFileSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { loadConfig } from "./config"

describe("loadConfig", () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "opencode-ntfy-test-"))
  })

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true })
  })

  it("returns null when config file does not exist", () => {
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("returns null when config file is invalid JSON", () => {
    writeFileSync(join(tempDir, ".opencode-ntfy.json"), "{invalid json}")
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("returns null when topic is missing", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({ server: "https://custom.example.com" })
    )
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("returns config with defaults when only topic is provided", () => {
    writeFileSync(join(tempDir, ".opencode-ntfy.json"), JSON.stringify({ topic: "my-topic" }))
    const result = loadConfig(tempDir)
    expect(result).not.toBeNull()
    expect(result!.server).toBe("https://ntfy.sh")
    expect(result!.topic).toBe("my-topic")
    expect(result!.events).toEqual(["session.idle", "session.error"])
  })

  it("returns full config when all fields are provided", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({
        server: "https://custom.example.com",
        topic: "my-topic",
        events: ["session.idle"],
      })
    )
    const result = loadConfig(tempDir)
    expect(result).not.toBeNull()
    expect(result!.server).toBe("https://custom.example.com")
    expect(result!.topic).toBe("my-topic")
    expect(result!.events).toEqual(["session.idle"])
  })

  it("returns null when events is not an array", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({ topic: "my-topic", events: "not-an-array" })
    )
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("returns null when events contains non-strings", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({ topic: "my-topic", events: ["session.idle", 123] })
    )
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("returns null when server is not a string", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({ topic: "my-topic", server: 123 })
    )
    const result = loadConfig(tempDir)
    expect(result).toBeNull()
  })

  it("handles empty events array", () => {
    writeFileSync(
      join(tempDir, ".opencode-ntfy.json"),
      JSON.stringify({ topic: "my-topic", events: [] })
    )
    const result = loadConfig(tempDir)
    expect(result).not.toBeNull()
    expect(result!.events).toEqual([])
  })
})
