import { Schema } from "effect"

/**
 * Data source for Kp readings
 * @doc docs/types/kp.md
 */
export const KpSource = Schema.Literal("noaa", "gfz")
export type KpSource = Schema.Schema.Type<typeof KpSource>

/**
 * Single planetary K-index reading
 * @doc docs/types/kp.md
 */
export const KpReading = Schema.Struct({
  /** ISO 8601 timestamp */
  time: Schema.String,
  /** Kp index value (0-9 scale) */
  kp: Schema.Number,
  /** True if this is an estimated/nowcast value */
  estimated: Schema.Boolean,
  /** Data source identifier */
  source: KpSource,
  /** Running planetary A-index (optional) */
  aRunning: Schema.optional(Schema.Number),
  /** Number of reporting stations (optional) */
  stationCount: Schema.optional(Schema.Number),
})
export type KpReading = Schema.Schema.Type<typeof KpReading>

/**
 * Response containing Kp index history
 * @doc docs/types/kp.md
 */
export const KpHistoryResponse = Schema.Struct({
  /** Array of Kp readings ordered by time */
  readings: Schema.Array(KpReading),
  /** Hours of history requested */
  hours: Schema.Number,
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type KpHistoryResponse = Schema.Schema.Type<typeof KpHistoryResponse>
