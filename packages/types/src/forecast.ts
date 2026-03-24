import { Schema } from "effect"
import { GScale } from "./status.js"

/**
 * Storm probability breakdown by G-scale level
 * @doc docs/types/forecast.md
 */
export const StormProbability = Schema.Struct({
  /** Probability of G1 (minor) storm level (0-100) */
  g1: Schema.optional(Schema.Number),
  /** Probability of G2 (moderate) storm level (0-100) */
  g2: Schema.optional(Schema.Number),
  /** Probability of G3 (strong) storm level (0-100) */
  g3: Schema.optional(Schema.Number),
  /** Probability of G4 (severe) storm level (0-100) */
  g4: Schema.optional(Schema.Number),
  /** Probability of G5 (extreme) storm level (0-100) */
  g5: Schema.optional(Schema.Number),
})
export type StormProbability = Schema.Schema.Type<typeof StormProbability>

/**
 * Single day forecast entry
 * @doc docs/types/forecast.md
 */
export const ForecastDay = Schema.Struct({
  /** ISO 8601 date string (YYYY-MM-DD) */
  date: Schema.String,
  /** Predicted maximum Kp index for the day (0-9) */
  kpMax: Schema.Number,
  /** Predicted G-scale level for the day */
  gScale: GScale,
  /** Storm probabilities by level */
  stormProbabilities: Schema.optional(StormProbability),
  /** Human-readable summary of the forecast */
  summary: Schema.optional(Schema.String),
})
export type ForecastDay = Schema.Schema.Type<typeof ForecastDay>

/**
 * 3-day space weather forecast response
 * @doc docs/types/forecast.md
 */
export const ForecastResponse = Schema.Struct({
  /** Array of daily forecasts (typically 3 days) */
  days: Schema.Array(ForecastDay),
  /** Number of days in the forecast */
  dayCount: Schema.Number,
  /** ISO 8601 timestamp when forecast was issued by source */
  issuedAt: Schema.optional(Schema.String),
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type ForecastResponse = Schema.Schema.Type<typeof ForecastResponse>
