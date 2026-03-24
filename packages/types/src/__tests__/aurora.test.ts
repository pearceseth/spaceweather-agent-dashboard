import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import {
  Hemisphere,
  AuroraViewlineEntry,
  AuroraProbabilityEntry,
  AuroraForecastResponse,
} from "../aurora.js"

describe("Hemisphere", () => {
  it("decodes valid hemisphere values", () => {
    expect(Schema.decodeUnknownSync(Hemisphere)("north")).toBe("north")
    expect(Schema.decodeUnknownSync(Hemisphere)("south")).toBe("south")
  })

  it("rejects invalid hemisphere values", () => {
    const invalidValues = ["North", "NORTH", "eastern", "west", ""]

    for (const value of invalidValues) {
      expect(() => Schema.decodeUnknownSync(Hemisphere)(value)).toThrow()
    }
  })
})

describe("AuroraViewlineEntry", () => {
  it("decodes valid coordinate data", () => {
    const input = {
      longitude: -122.4,
      latitude: 47.6,
    }

    const result = Schema.decodeUnknownSync(AuroraViewlineEntry)(input)

    expect(result.longitude).toBe(-122.4)
    expect(result.latitude).toBe(47.6)
  })

  it("rejects missing required fields", () => {
    expect(() => Schema.decodeUnknownSync(AuroraViewlineEntry)({ longitude: 0 })).toThrow()
    expect(() => Schema.decodeUnknownSync(AuroraViewlineEntry)({ latitude: 0 })).toThrow()
  })
})

describe("AuroraProbabilityEntry", () => {
  it("decodes valid probability data", () => {
    const input = {
      longitude: -122.4,
      latitude: 47.6,
      probability: 75,
    }

    const result = Schema.decodeUnknownSync(AuroraProbabilityEntry)(input)

    expect(result.longitude).toBe(-122.4)
    expect(result.latitude).toBe(47.6)
    expect(result.probability).toBe(75)
  })

  it("rejects missing required fields", () => {
    expect(() =>
      Schema.decodeUnknownSync(AuroraProbabilityEntry)({
        longitude: 0,
        latitude: 0,
      })
    ).toThrow()
  })
})

describe("AuroraForecastResponse", () => {
  it("decodes complete data (all fields)", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "north",
      viewline: [
        { longitude: -180, latitude: 55.2 },
        { longitude: -90, latitude: 52.1 },
        { longitude: 0, latitude: 54.8 },
      ],
      probabilityData: [
        { longitude: -122.4, latitude: 47.6, probability: 75 },
        { longitude: -121.0, latitude: 48.0, probability: 80 },
      ],
      kpCurrent: 5.33,
      kpMax: 6.0,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(AuroraForecastResponse)(input)

    expect(result.forecastTime).toBe("2026-03-23T12:00:00Z")
    expect(result.hemisphere).toBe("north")
    expect(result.viewline).toHaveLength(3)
    expect(result.probabilityData).toHaveLength(2)
    expect(result.kpCurrent).toBe(5.33)
    expect(result.kpMax).toBe(6.0)
    expect(result.fetchedAt).toBe("2026-03-23T12:05:00Z")
  })

  it("decodes minimal data (required fields only)", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "south",
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(AuroraForecastResponse)(input)

    expect(result.forecastTime).toBe("2026-03-23T12:00:00Z")
    expect(result.hemisphere).toBe("south")
    expect(result.viewline).toBeUndefined()
    expect(result.probabilityData).toBeUndefined()
    expect(result.kpCurrent).toBeUndefined()
    expect(result.kpMax).toBeUndefined()
    expect(result.fetchedAt).toBe("2026-03-23T12:05:00Z")
  })

  it("decodes partial data (viewline only, no probability grid)", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "north",
      viewline: [
        { longitude: -180, latitude: 55.2 },
        { longitude: 0, latitude: 54.8 },
      ],
      kpCurrent: 4.0,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(AuroraForecastResponse)(input)

    expect(result.viewline).toHaveLength(2)
    expect(result.probabilityData).toBeUndefined()
    expect(result.kpCurrent).toBe(4.0)
  })

  it("rejects missing required field (fetchedAt)", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "north",
    }

    expect(() => Schema.decodeUnknownSync(AuroraForecastResponse)(input)).toThrow()
  })

  it("rejects missing required field (hemisphere)", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    expect(() => Schema.decodeUnknownSync(AuroraForecastResponse)(input)).toThrow()
  })

  it("rejects invalid hemisphere value", () => {
    const input = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "east",
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    expect(() => Schema.decodeUnknownSync(AuroraForecastResponse)(input)).toThrow()
  })

  it("round-trips correctly through encode/decode", () => {
    const original = {
      forecastTime: "2026-03-23T12:00:00Z",
      hemisphere: "north" as const,
      viewline: [{ longitude: -122.4, latitude: 47.6 }],
      kpCurrent: 5.0,
      kpMax: 6.0,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const decoded = Schema.decodeUnknownSync(AuroraForecastResponse)(original)
    const encoded = Schema.encodeSync(AuroraForecastResponse)(decoded)
    const reDecoded = Schema.decodeUnknownSync(AuroraForecastResponse)(encoded)

    expect(reDecoded).toEqual(decoded)
  })
})
