import { describe, it, expect } from "vitest"
import { Schema } from "effect"
import { GScale, StatusResponse } from "../status.js"

describe("GScale", () => {
  it("decodes valid G-scale values (G0-G5)", () => {
    const validValues = ["G0", "G1", "G2", "G3", "G4", "G5"] as const

    for (const value of validValues) {
      const result = Schema.decodeUnknownSync(GScale)(value)
      expect(result).toBe(value)
    }
  })

  it("rejects invalid G-scale values", () => {
    const invalidValues = ["G6", "g0", "storm", "", "0", "G-1"]

    for (const value of invalidValues) {
      expect(() => Schema.decodeUnknownSync(GScale)(value)).toThrow()
    }
  })
})

describe("StatusResponse", () => {
  it("decodes complete data correctly", () => {
    const input = {
      kp: 5.33,
      gScale: "G1",
      bz: -8.5,
      bt: 12.3,
      speed: 450,
      density: 5.2,
      xRayFlux: "C1.3",
      protonFlux: 10.5,
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    const result = Schema.decodeUnknownSync(StatusResponse)(input)

    expect(result.kp).toBe(5.33)
    expect(result.gScale).toBe("G1")
    expect(result.bz).toBe(-8.5)
    expect(result.bt).toBe(12.3)
    expect(result.speed).toBe(450)
    expect(result.density).toBe(5.2)
    expect(result.xRayFlux).toBe("C1.3")
    expect(result.protonFlux).toBe(10.5)
    expect(result.fetchedAt).toBe("2026-03-23T12:00:00Z")
  })

  it("decodes partial data (active conditions)", () => {
    const input = {
      kp: 6.0,
      gScale: "G2",
      bz: -15.2,
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    const result = Schema.decodeUnknownSync(StatusResponse)(input)

    expect(result.kp).toBe(6.0)
    expect(result.gScale).toBe("G2")
    expect(result.bz).toBe(-15.2)
    expect(result.bt).toBeUndefined()
    expect(result.speed).toBeUndefined()
    expect(result.density).toBeUndefined()
    expect(result.xRayFlux).toBeUndefined()
    expect(result.protonFlux).toBeUndefined()
    expect(result.fetchedAt).toBe("2026-03-23T12:00:00Z")
  })

  it("decodes partial data (solar wind only)", () => {
    const input = {
      speed: 650,
      density: 8.3,
      bt: 18.5,
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    const result = Schema.decodeUnknownSync(StatusResponse)(input)

    expect(result.kp).toBeUndefined()
    expect(result.gScale).toBeUndefined()
    expect(result.bz).toBeUndefined()
    expect(result.bt).toBe(18.5)
    expect(result.speed).toBe(650)
    expect(result.density).toBe(8.3)
    expect(result.xRayFlux).toBeUndefined()
    expect(result.protonFlux).toBeUndefined()
    expect(result.fetchedAt).toBe("2026-03-23T12:00:00Z")
  })

  it("decodes minimal data (fetchedAt only)", () => {
    const input = {
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    const result = Schema.decodeUnknownSync(StatusResponse)(input)

    expect(result.kp).toBeUndefined()
    expect(result.gScale).toBeUndefined()
    expect(result.bz).toBeUndefined()
    expect(result.bt).toBeUndefined()
    expect(result.speed).toBeUndefined()
    expect(result.density).toBeUndefined()
    expect(result.xRayFlux).toBeUndefined()
    expect(result.protonFlux).toBeUndefined()
    expect(result.fetchedAt).toBe("2026-03-23T12:00:00Z")
  })

  it("rejects missing fetchedAt", () => {
    const input = {
      kp: 5.0,
      gScale: "G1",
      bz: -8.5,
    }

    expect(() => Schema.decodeUnknownSync(StatusResponse)(input)).toThrow()
  })

  it("rejects invalid gScale value", () => {
    const input = {
      gScale: "G6",
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    expect(() => Schema.decodeUnknownSync(StatusResponse)(input)).toThrow()
  })

  it("round-trips correctly through encode/decode", () => {
    const original = {
      kp: 5.33,
      gScale: "G1" as const,
      bz: -8.5,
      bt: 12.3,
      speed: 450,
      density: 5.2,
      xRayFlux: "C1.3",
      protonFlux: 10.5,
      fetchedAt: "2026-03-23T12:00:00Z",
    }

    const decoded = Schema.decodeUnknownSync(StatusResponse)(original)
    const encoded = Schema.encodeSync(StatusResponse)(decoded)
    const reDecoded = Schema.decodeUnknownSync(StatusResponse)(encoded)

    expect(reDecoded).toEqual(decoded)
  })
})
