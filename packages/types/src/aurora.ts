import { Schema } from "effect"

/**
 * Hemisphere indicator for aurora data
 * @doc docs/types/aurora.md
 */
export const Hemisphere = Schema.Literal("north", "south")
export type Hemisphere = Schema.Schema.Type<typeof Hemisphere>

/**
 * Aurora viewline latitude entry - shows the southernmost latitude where aurora may be visible
 * @doc docs/types/aurora.md
 */
export const AuroraViewlineEntry = Schema.Struct({
  /** Longitude in degrees (-180 to 180) */
  longitude: Schema.Number,
  /** Latitude in degrees where aurora may be visible on the horizon */
  latitude: Schema.Number,
})
export type AuroraViewlineEntry = Schema.Schema.Type<typeof AuroraViewlineEntry>

/**
 * Aurora probability data point for a specific location
 * @doc docs/types/aurora.md
 */
export const AuroraProbabilityEntry = Schema.Struct({
  /** Longitude in degrees */
  longitude: Schema.Number,
  /** Latitude in degrees */
  latitude: Schema.Number,
  /** Probability of aurora visibility (0-100) */
  probability: Schema.Number,
})
export type AuroraProbabilityEntry = Schema.Schema.Type<typeof AuroraProbabilityEntry>

/**
 * OVATION aurora forecast response
 * @doc docs/types/aurora.md
 */
export const AuroraForecastResponse = Schema.Struct({
  /** ISO 8601 timestamp of the forecast */
  forecastTime: Schema.String,
  /** Hemisphere this forecast applies to */
  hemisphere: Hemisphere,
  /** Viewline latitude data points showing aurora visibility boundary */
  viewline: Schema.optional(Schema.Array(AuroraViewlineEntry)),
  /** Probability grid data (optional, may be large) */
  probabilityData: Schema.optional(Schema.Array(AuroraProbabilityEntry)),
  /** Current Kp value used for the forecast */
  kpCurrent: Schema.optional(Schema.Number),
  /** Maximum predicted Kp in the forecast period */
  kpMax: Schema.optional(Schema.Number),
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type AuroraForecastResponse = Schema.Schema.Type<typeof AuroraForecastResponse>
