import { Schema } from "effect"

/**
 * NOAA Geomagnetic Storm Scale (G0 = quiet, G5 = extreme)
 * @doc docs/types/status.md
 */
export const GScale = Schema.Literal("G0", "G1", "G2", "G3", "G4", "G5")
export type GScale = Schema.Schema.Type<typeof GScale>

/**
 * Aggregated current space weather status
 * @doc docs/types/status.md
 */
export const StatusResponse = Schema.Struct({
  /** Current planetary Kp index value (0-9 scale) */
  kp: Schema.optional(Schema.Number),
  /** Current NOAA geomagnetic storm scale level */
  gScale: Schema.optional(GScale),
  /** IMF Bz component in nT (negative = southward, geomagnetically active) */
  bz: Schema.optional(Schema.Number),
  /** IMF total field strength in nT */
  bt: Schema.optional(Schema.Number),
  /** Solar wind speed in km/s */
  speed: Schema.optional(Schema.Number),
  /** Solar wind proton density in particles/cm^3 */
  density: Schema.optional(Schema.Number),
  /** Current X-ray flux level (e.g., "B5.2", "C1.3", "M2.1", "X1.5") */
  xRayFlux: Schema.optional(Schema.String),
  /** Current proton flux level in pfu (particle flux units) */
  protonFlux: Schema.optional(Schema.Number),
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type StatusResponse = Schema.Schema.Type<typeof StatusResponse>
