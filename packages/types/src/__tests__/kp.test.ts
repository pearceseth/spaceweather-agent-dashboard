import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import { KpReading, KpHistoryResponse } from "../kp.js"

describe("KpReading", () => {
  it("decodes valid NOAA-style data correctly", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      kp: 5.33,
      estimated: false,
      source: "noaa",
      aRunning: 48,
      stationCount: 8,
    }

    const result = Schema.decodeUnknownSync(KpReading)(input)

    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.kp).toBe(5.33)
    expect(result.estimated).toBe(false)
    expect(result.source).toBe("noaa")
    expect(result.aRunning).toBe(48)
    expect(result.stationCount).toBe(8)
  })

  it("decodes valid GFZ-style data (minimal)", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      kp: 4.0,
      estimated: true,
      source: "gfz",
    }

    const result = Schema.decodeUnknownSync(KpReading)(input)

    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.kp).toBe(4.0)
    expect(result.estimated).toBe(true)
    expect(result.source).toBe("gfz")
    expect(result.aRunning).toBeUndefined()
    expect(result.stationCount).toBeUndefined()
  })

  it("rejects invalid source literal", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      kp: 5,
      estimated: false,
      source: "invalid",
    }

    expect(() => Schema.decodeUnknownSync(KpReading)(input)).toThrow()
  })

  it("rejects missing required field", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      kp: 5,
      estimated: false,
      // missing source
    }

    expect(() => Schema.decodeUnknownSync(KpReading)(input)).toThrow()
  })
})

describe("KpHistoryResponse", () => {
  it("decodes complete response", () => {
    const input = {
      readings: [
        {
          time: "2026-03-23T12:00:00Z",
          kp: 5.33,
          estimated: false,
          source: "noaa",
        },
        {
          time: "2026-03-23T15:00:00Z",
          kp: 4.0,
          estimated: true,
          source: "gfz",
        },
      ],
      hours: 24,
      fetchedAt: "2026-03-23T16:00:00Z",
    }

    const result = Schema.decodeUnknownSync(KpHistoryResponse)(input)

    expect(result.readings).toHaveLength(2)
    expect(result.readings[0]!.kp).toBe(5.33)
    expect(result.readings[1]!.source).toBe("gfz")
    expect(result.hours).toBe(24)
    expect(result.fetchedAt).toBe("2026-03-23T16:00:00Z")
  })

  it("rejects missing required fields", () => {
    const input = {
      readings: [],
      // missing hours and fetchedAt
    }

    expect(() => Schema.decodeUnknownSync(KpHistoryResponse)(input)).toThrow()
  })
})
