import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import { StormProbability, ForecastDay, ForecastResponse } from "../forecast.js"

describe("StormProbability", () => {
  it("decodes complete data (all G-levels)", () => {
    const input = {
      g1: 80,
      g2: 50,
      g3: 25,
      g4: 10,
      g5: 5,
    }

    const result = Schema.decodeUnknownSync(StormProbability)(input)

    expect(result.g1).toBe(80)
    expect(result.g2).toBe(50)
    expect(result.g3).toBe(25)
    expect(result.g4).toBe(10)
    expect(result.g5).toBe(5)
  })

  it("decodes partial data (some G-levels)", () => {
    const input = {
      g1: 60,
      g2: 30,
    }

    const result = Schema.decodeUnknownSync(StormProbability)(input)

    expect(result.g1).toBe(60)
    expect(result.g2).toBe(30)
    expect(result.g3).toBeUndefined()
    expect(result.g4).toBeUndefined()
    expect(result.g5).toBeUndefined()
  })

  it("decodes empty object", () => {
    const result = Schema.decodeUnknownSync(StormProbability)({})

    expect(result.g1).toBeUndefined()
    expect(result.g2).toBeUndefined()
    expect(result.g3).toBeUndefined()
    expect(result.g4).toBeUndefined()
    expect(result.g5).toBeUndefined()
  })
})

describe("ForecastDay", () => {
  it("decodes complete data (all fields)", () => {
    const input = {
      date: "2026-03-24",
      kpMax: 6,
      gScale: "G2",
      stormProbabilities: {
        g1: 90,
        g2: 60,
        g3: 25,
      },
      summary: "Moderate geomagnetic storm conditions expected",
    }

    const result = Schema.decodeUnknownSync(ForecastDay)(input)

    expect(result.date).toBe("2026-03-24")
    expect(result.kpMax).toBe(6)
    expect(result.gScale).toBe("G2")
    expect(result.stormProbabilities?.g1).toBe(90)
    expect(result.stormProbabilities?.g2).toBe(60)
    expect(result.summary).toBe("Moderate geomagnetic storm conditions expected")
  })

  it("decodes minimal data (required fields only)", () => {
    const input = {
      date: "2026-03-24",
      kpMax: 3,
      gScale: "G0",
    }

    const result = Schema.decodeUnknownSync(ForecastDay)(input)

    expect(result.date).toBe("2026-03-24")
    expect(result.kpMax).toBe(3)
    expect(result.gScale).toBe("G0")
    expect(result.stormProbabilities).toBeUndefined()
    expect(result.summary).toBeUndefined()
  })

  it("rejects invalid gScale value", () => {
    const input = {
      date: "2026-03-24",
      kpMax: 3,
      gScale: "G6",
    }

    expect(() => Schema.decodeUnknownSync(ForecastDay)(input)).toThrow()
  })

  it("rejects missing required field (date)", () => {
    const input = {
      kpMax: 3,
      gScale: "G0",
    }

    expect(() => Schema.decodeUnknownSync(ForecastDay)(input)).toThrow()
  })

  it("rejects missing required field (kpMax)", () => {
    const input = {
      date: "2026-03-24",
      gScale: "G0",
    }

    expect(() => Schema.decodeUnknownSync(ForecastDay)(input)).toThrow()
  })

  it("rejects missing required field (gScale)", () => {
    const input = {
      date: "2026-03-24",
      kpMax: 3,
    }

    expect(() => Schema.decodeUnknownSync(ForecastDay)(input)).toThrow()
  })
})

describe("ForecastResponse", () => {
  it("decodes complete 3-day forecast", () => {
    const input = {
      days: [
        { date: "2026-03-24", kpMax: 4, gScale: "G0" },
        { date: "2026-03-25", kpMax: 6, gScale: "G2", summary: "Moderate storm expected" },
        { date: "2026-03-26", kpMax: 5, gScale: "G1" },
      ],
      dayCount: 3,
      issuedAt: "2026-03-23T12:00:00Z",
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(ForecastResponse)(input)

    expect(result.days).toHaveLength(3)
    expect(result.days[0]!.date).toBe("2026-03-24")
    expect(result.days[1]!.gScale).toBe("G2")
    expect(result.days[2]!.kpMax).toBe(5)
    expect(result.dayCount).toBe(3)
    expect(result.issuedAt).toBe("2026-03-23T12:00:00Z")
    expect(result.fetchedAt).toBe("2026-03-23T12:05:00Z")
  })

  it("decodes empty days array", () => {
    const input = {
      days: [],
      dayCount: 0,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(ForecastResponse)(input)

    expect(result.days).toHaveLength(0)
    expect(result.dayCount).toBe(0)
    expect(result.issuedAt).toBeUndefined()
  })

  it("decodes without optional issuedAt", () => {
    const input = {
      days: [{ date: "2026-03-24", kpMax: 4, gScale: "G0" }],
      dayCount: 1,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const result = Schema.decodeUnknownSync(ForecastResponse)(input)

    expect(result.days).toHaveLength(1)
    expect(result.issuedAt).toBeUndefined()
  })

  it("rejects missing fetchedAt", () => {
    const input = {
      days: [],
      dayCount: 0,
    }

    expect(() => Schema.decodeUnknownSync(ForecastResponse)(input)).toThrow()
  })

  it("rejects missing dayCount", () => {
    const input = {
      days: [],
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    expect(() => Schema.decodeUnknownSync(ForecastResponse)(input)).toThrow()
  })

  it("rejects invalid gScale in nested ForecastDay", () => {
    const input = {
      days: [{ date: "2026-03-24", kpMax: 4, gScale: "INVALID" }],
      dayCount: 1,
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    expect(() => Schema.decodeUnknownSync(ForecastResponse)(input)).toThrow()
  })

  it("round-trips correctly through encode/decode", () => {
    const original = {
      days: [
        {
          date: "2026-03-24",
          kpMax: 6,
          gScale: "G2" as const,
          stormProbabilities: { g1: 90, g2: 60 },
          summary: "Moderate storm expected",
        },
      ],
      dayCount: 1,
      issuedAt: "2026-03-23T12:00:00Z",
      fetchedAt: "2026-03-23T12:05:00Z",
    }

    const decoded = Schema.decodeUnknownSync(ForecastResponse)(original)
    const encoded = Schema.encodeSync(ForecastResponse)(decoded)
    const reDecoded = Schema.decodeUnknownSync(ForecastResponse)(encoded)

    expect(reDecoded).toEqual(decoded)
  })
})
