import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import {
  EventType,
  EventSeverity,
  EventSource,
  SpaceWeatherEvent,
  RecentEventsResponse,
} from "../events.js"

describe("EventType", () => {
  it("decodes valid event types (all 5 values)", () => {
    const validTypes = [
      "SOLAR_FLARE",
      "CME",
      "GEOMAGNETIC_STORM",
      "HIGH_SPEED_STREAM",
      "ALERT",
    ] as const

    for (const type of validTypes) {
      const result = Schema.decodeUnknownSync(EventType)(type)
      expect(result).toBe(type)
    }
  })

  it("rejects invalid event type values", () => {
    const invalidTypes = ["FLARE", "cme", "storm", "", "UNKNOWN", "geomagnetic_storm"]

    for (const type of invalidTypes) {
      expect(() => Schema.decodeUnknownSync(EventType)(type)).toThrow()
    }
  })
})

describe("EventSeverity", () => {
  it("decodes valid severity levels (all 5 values)", () => {
    const validSeverities = ["minor", "moderate", "strong", "severe", "extreme"] as const

    for (const severity of validSeverities) {
      const result = Schema.decodeUnknownSync(EventSeverity)(severity)
      expect(result).toBe(severity)
    }
  })

  it("rejects invalid severity values", () => {
    const invalidSeverities = ["low", "high", "MINOR", "Moderate", "", "critical"]

    for (const severity of invalidSeverities) {
      expect(() => Schema.decodeUnknownSync(EventSeverity)(severity)).toThrow()
    }
  })
})

describe("EventSource", () => {
  it("decodes valid source values", () => {
    const validSources = ["donki", "swpc"] as const

    for (const source of validSources) {
      const result = Schema.decodeUnknownSync(EventSource)(source)
      expect(result).toBe(source)
    }
  })

  it("rejects invalid source values", () => {
    const invalidSources = ["DONKI", "nasa", "noaa", ""]

    for (const source of invalidSources) {
      expect(() => Schema.decodeUnknownSync(EventSource)(source)).toThrow()
    }
  })
})

describe("SpaceWeatherEvent", () => {
  it("decodes complete event data correctly (DONKI CME)", () => {
    const input = {
      id: "2026-03-23T12:00:00-CME-001",
      type: "CME",
      severity: "moderate",
      time: "2026-03-23T12:00:00Z",
      description: "Coronal mass ejection observed from AR3623",
      source: "donki",
      sourceUrl: "https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/12345",
      endTime: "2026-03-23T14:30:00Z",
      linkedEvents: ["2026-03-23T11:45:00-FLR-001", "2026-03-23T11:50:00-SEP-001"],
    }

    const result = Schema.decodeUnknownSync(SpaceWeatherEvent)(input)

    expect(result.id).toBe("2026-03-23T12:00:00-CME-001")
    expect(result.type).toBe("CME")
    expect(result.severity).toBe("moderate")
    expect(result.time).toBe("2026-03-23T12:00:00Z")
    expect(result.description).toBe("Coronal mass ejection observed from AR3623")
    expect(result.source).toBe("donki")
    expect(result.sourceUrl).toBe("https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/12345")
    expect(result.endTime).toBe("2026-03-23T14:30:00Z")
    expect(result.linkedEvents).toEqual(["2026-03-23T11:45:00-FLR-001", "2026-03-23T11:50:00-SEP-001"])
  })

  it("decodes minimal event data (required fields only)", () => {
    const input = {
      id: "SWPC-ALERT-001",
      type: "ALERT",
      severity: "minor",
      time: "2026-03-23T12:00:00Z",
      description: "Minor geomagnetic storm watch in effect",
      source: "swpc",
    }

    const result = Schema.decodeUnknownSync(SpaceWeatherEvent)(input)

    expect(result.id).toBe("SWPC-ALERT-001")
    expect(result.type).toBe("ALERT")
    expect(result.severity).toBe("minor")
    expect(result.sourceUrl).toBeUndefined()
    expect(result.endTime).toBeUndefined()
    expect(result.linkedEvents).toBeUndefined()
  })

  it("decodes event with linked events array", () => {
    const input = {
      id: "2026-03-23T12:00:00-GST-001",
      type: "GEOMAGNETIC_STORM",
      severity: "severe",
      time: "2026-03-23T12:00:00Z",
      description: "G4 severe geomagnetic storm",
      source: "swpc",
      linkedEvents: ["2026-03-21T08:00:00-CME-001"],
    }

    const result = Schema.decodeUnknownSync(SpaceWeatherEvent)(input)

    expect(result.linkedEvents).toEqual(["2026-03-21T08:00:00-CME-001"])
  })

  it("rejects missing required field (id)", () => {
    const input = {
      type: "SOLAR_FLARE",
      severity: "strong",
      time: "2026-03-23T12:00:00Z",
      description: "X2.5 solar flare",
      source: "donki",
    }

    expect(() => Schema.decodeUnknownSync(SpaceWeatherEvent)(input)).toThrow()
  })

  it("rejects missing required field (type)", () => {
    const input = {
      id: "FLR-001",
      severity: "strong",
      time: "2026-03-23T12:00:00Z",
      description: "X2.5 solar flare",
      source: "donki",
    }

    expect(() => Schema.decodeUnknownSync(SpaceWeatherEvent)(input)).toThrow()
  })

  it("rejects invalid event type in struct", () => {
    const input = {
      id: "FLR-001",
      type: "INVALID_TYPE",
      severity: "strong",
      time: "2026-03-23T12:00:00Z",
      description: "X2.5 solar flare",
      source: "donki",
    }

    expect(() => Schema.decodeUnknownSync(SpaceWeatherEvent)(input)).toThrow()
  })

  it("rejects invalid severity in struct", () => {
    const input = {
      id: "FLR-001",
      type: "SOLAR_FLARE",
      severity: "critical",
      time: "2026-03-23T12:00:00Z",
      description: "X2.5 solar flare",
      source: "donki",
    }

    expect(() => Schema.decodeUnknownSync(SpaceWeatherEvent)(input)).toThrow()
  })

  it("rejects invalid source in struct", () => {
    const input = {
      id: "FLR-001",
      type: "SOLAR_FLARE",
      severity: "strong",
      time: "2026-03-23T12:00:00Z",
      description: "X2.5 solar flare",
      source: "nasa",
    }

    expect(() => Schema.decodeUnknownSync(SpaceWeatherEvent)(input)).toThrow()
  })
})

describe("RecentEventsResponse", () => {
  it("decodes complete response with multiple events", () => {
    const input = {
      events: [
        {
          id: "FLR-001",
          type: "SOLAR_FLARE",
          severity: "strong",
          time: "2026-03-23T12:00:00Z",
          description: "X2.5 solar flare",
          source: "donki",
        },
        {
          id: "CME-001",
          type: "CME",
          severity: "moderate",
          time: "2026-03-23T10:00:00Z",
          description: "CME observed",
          source: "donki",
        },
        {
          id: "ALERT-001",
          type: "ALERT",
          severity: "minor",
          time: "2026-03-23T08:00:00Z",
          description: "Watch issued",
          source: "swpc",
        },
      ],
      count: 3,
      fetchedAt: "2026-03-23T14:00:00Z",
    }

    const result = Schema.decodeUnknownSync(RecentEventsResponse)(input)

    expect(result.events).toHaveLength(3)
    expect(result.events[0]!.type).toBe("SOLAR_FLARE")
    expect(result.events[1]!.type).toBe("CME")
    expect(result.events[2]!.type).toBe("ALERT")
    expect(result.count).toBe(3)
    expect(result.fetchedAt).toBe("2026-03-23T14:00:00Z")
  })

  it("decodes empty events array", () => {
    const input = {
      events: [],
      count: 0,
      fetchedAt: "2026-03-23T14:00:00Z",
    }

    const result = Schema.decodeUnknownSync(RecentEventsResponse)(input)

    expect(result.events).toHaveLength(0)
    expect(result.count).toBe(0)
  })

  it("rejects missing required fields", () => {
    const input = {
      events: [],
      count: 0,
      // missing fetchedAt
    }

    expect(() => Schema.decodeUnknownSync(RecentEventsResponse)(input)).toThrow()
  })

  it("round-trips correctly through encode/decode", () => {
    const original = {
      events: [
        {
          id: "FLR-001",
          type: "SOLAR_FLARE" as const,
          severity: "extreme" as const,
          time: "2026-03-23T12:00:00Z",
          description: "X5.0 solar flare",
          source: "donki" as const,
          sourceUrl: "https://example.com/flare/001",
          linkedEvents: ["CME-001"],
        },
      ],
      count: 1,
      fetchedAt: "2026-03-23T14:00:00Z",
    }

    const decoded = Schema.decodeUnknownSync(RecentEventsResponse)(original)
    const encoded = Schema.encodeSync(RecentEventsResponse)(decoded)
    const reDecoded = Schema.decodeUnknownSync(RecentEventsResponse)(encoded)

    expect(reDecoded).toEqual(decoded)
  })
})
