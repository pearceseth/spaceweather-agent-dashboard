import { Schema } from "effect"

/**
 * Single solar wind plasma measurement from DSCOVR/ACE
 * @doc docs/types/solar-wind.md
 */
export const SolarWindReading = Schema.Struct({
  /** ISO 8601 timestamp */
  time: Schema.String,
  /** Solar wind speed in km/s (may be absent during data gaps) */
  speed: Schema.optional(Schema.Number),
  /** Proton density in particles/cm^3 (may be absent during data gaps) */
  density: Schema.optional(Schema.Number),
  /** Proton temperature in Kelvin (may be absent during data gaps) */
  temperature: Schema.optional(Schema.Number),
  /** IMF Bz component in nT (negative = southward, geomagnetically active) */
  bz: Schema.optional(Schema.Number),
  /** IMF total field strength in nT */
  bt: Schema.optional(Schema.Number),
})
export type SolarWindReading = Schema.Schema.Type<typeof SolarWindReading>

/**
 * Response containing solar wind history
 * @doc docs/types/solar-wind.md
 */
export const SolarWindHistoryResponse = Schema.Struct({
  /** Array of solar wind readings ordered by time */
  readings: Schema.Array(SolarWindReading),
  /** Hours of history requested */
  hours: Schema.Number,
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type SolarWindHistoryResponse = Schema.Schema.Type<typeof SolarWindHistoryResponse>
