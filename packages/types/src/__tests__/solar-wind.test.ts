import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import { SolarWindReading, SolarWindHistoryResponse } from "../solar-wind.js"

describe("SolarWindReading", () => {
  it("decodes complete data correctly", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      speed: 450,
      density: 5.2,
      temperature: 150000,
      bz: -8.5,
      bt: 12.3,
    }

    const result = Schema.decodeUnknownSync(SolarWindReading)(input)

    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.speed).toBe(450)
    expect(result.density).toBe(5.2)
    expect(result.temperature).toBe(150000)
    expect(result.bz).toBe(-8.5)
    expect(result.bt).toBe(12.3)
  })

  it("decodes partial data (DSCOVR gap)", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
      density: 1.2,
    }

    const result = Schema.decodeUnknownSync(SolarWindReading)(input)

    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.density).toBe(1.2)
    expect(result.speed).toBeUndefined()
    expect(result.temperature).toBeUndefined()
    expect(result.bz).toBeUndefined()
    expect(result.bt).toBeUndefined()
  })

  it("decodes minimal data (time only)", () => {
    const input = {
      time: "2026-03-23T12:00:00Z",
    }

    const result = Schema.decodeUnknownSync(SolarWindReading)(input)

    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.speed).toBeUndefined()
    expect(result.density).toBeUndefined()
    expect(result.temperature).toBeUndefined()
    expect(result.bz).toBeUndefined()
    expect(result.bt).toBeUndefined()
  })

  it("rejects missing time field", () => {
    const input = {
      speed: 450,
      density: 5.2,
    }

    expect(() => Schema.decodeUnknownSync(SolarWindReading)(input)).toThrow()
  })
})

describe("SolarWindHistoryResponse", () => {
  it("round-trips correctly through encode/decode", () => {
    const original = {
      readings: [
        {
          time: "2026-03-23T12:00:00Z",
          speed: 450,
          density: 5.2,
          temperature: 150000,
          bz: -8.5,
          bt: 12.3,
        },
        {
          time: "2026-03-23T12:05:00Z",
          speed: 455,
        },
      ],
      hours: 24,
      fetchedAt: "2026-03-23T16:00:00Z",
    }

    const decoded = Schema.decodeUnknownSync(SolarWindHistoryResponse)(original)
    const encoded = Schema.encodeSync(SolarWindHistoryResponse)(decoded)
    const reDecoded = Schema.decodeUnknownSync(SolarWindHistoryResponse)(encoded)

    expect(reDecoded).toEqual(decoded)
  })

  it("rejects non-array readings", () => {
    const input = {
      readings: "not-an-array",
      hours: 24,
      fetchedAt: "2026-03-23T16:00:00Z",
    }

    expect(() => Schema.decodeUnknownSync(SolarWindHistoryResponse)(input)).toThrow()
  })

  it("decodes empty readings array", () => {
    const input = {
      readings: [],
      hours: 24,
      fetchedAt: "2026-03-23T16:00:00Z",
    }

    const result = Schema.decodeUnknownSync(SolarWindHistoryResponse)(input)

    expect(result.readings).toHaveLength(0)
    expect(result.hours).toBe(24)
  })
})
