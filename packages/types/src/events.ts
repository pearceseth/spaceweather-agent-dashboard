import { Schema } from "effect"

/**
 * Type of space weather event
 * @doc docs/types/events.md
 */
export const EventType = Schema.Literal(
  "SOLAR_FLARE",
  "CME",
  "GEOMAGNETIC_STORM",
  "HIGH_SPEED_STREAM",
  "ALERT"
)
export type EventType = Schema.Schema.Type<typeof EventType>

/**
 * Severity level following NOAA space weather scales
 * @doc docs/types/events.md
 */
export const EventSeverity = Schema.Literal(
  "minor",
  "moderate",
  "strong",
  "severe",
  "extreme"
)
export type EventSeverity = Schema.Schema.Type<typeof EventSeverity>

/**
 * Data source for event information
 * @doc docs/types/events.md
 */
export const EventSource = Schema.Literal("donki", "swpc")
export type EventSource = Schema.Schema.Type<typeof EventSource>

/**
 * Single space weather event
 * @doc docs/types/events.md
 */
export const SpaceWeatherEvent = Schema.Struct({
  /** Unique event identifier */
  id: Schema.String,
  /** Event category */
  type: EventType,
  /** Severity level */
  severity: EventSeverity,
  /** ISO 8601 timestamp when event occurred/started */
  time: Schema.String,
  /** Human-readable event description */
  description: Schema.String,
  /** Data source identifier */
  source: EventSource,
  /** Link to source details (optional) */
  sourceUrl: Schema.optional(Schema.String),
  /** ISO 8601 timestamp when event ended (optional, for duration events) */
  endTime: Schema.optional(Schema.String),
  /** Related event IDs from the same source (optional) */
  linkedEvents: Schema.optional(Schema.Array(Schema.String)),
})
export type SpaceWeatherEvent = Schema.Schema.Type<typeof SpaceWeatherEvent>

/**
 * Response containing recent space weather events
 * @doc docs/types/events.md
 */
export const RecentEventsResponse = Schema.Struct({
  /** Array of events ordered by time (most recent first) */
  events: Schema.Array(SpaceWeatherEvent),
  /** Number of events returned */
  count: Schema.Number,
  /** ISO 8601 timestamp when data was fetched */
  fetchedAt: Schema.String,
})
export type RecentEventsResponse = Schema.Schema.Type<typeof RecentEventsResponse>
