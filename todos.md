# Space Weather Dashboard - Task List

Tasks are organized in dependency order. Each task can be completed and tested independently.

---

## Phase 1: Monorepo Foundation

### 1.1 Initialize pnpm workspace and root configuration
- [x] Create `package.json` with workspace scripts (dev, build, lint, test, check)
- [x] Create `pnpm-workspace.yaml` pointing to `packages/*`
- [x] Create `turbo.json` with pipeline configuration
- [x] Create `tsconfig.base.json` with shared compiler options
- [x] Create `biome.json` for linting and formatting
- [x] Create `.env.example` with required environment variables
- [x] Create `.gitignore` for node_modules, dist, .next, .env.local

**Test:** Run `pnpm install` successfully, `pnpm check` runs without errors on empty workspace

---

## Phase 2: Docker Configuration (Early Validation)

### 2.1 Create minimal package stubs for Docker testing
- [x] Create `packages/types/package.json` with effect dependencies
- [x] Create `packages/types/tsconfig.json` extending base config
- [x] Create `packages/types/src/index.ts` with placeholder export
- [x] Create `packages/api/package.json` with effect-platform dependencies
- [x] Create `packages/api/tsconfig.json`
- [x] Create `packages/api/src/index.ts` with minimal HTTP server (health endpoint only)
- [x] Create `packages/agent/package.json` with anthropic-ai/sdk dependency
- [x] Create `packages/agent/tsconfig.json`
- [x] Create `packages/agent/src/index.ts` with placeholder export
- [x] Create `packages/web/package.json` with Next.js, React, Tailwind
- [x] Create `packages/web/tsconfig.json`
- [x] Create `packages/web/next.config.ts` with standalone output
- [x] Create `packages/web/src/app/layout.tsx` minimal layout
- [x] Create `packages/web/src/app/page.tsx` placeholder page

**Test:** `pnpm install && pnpm build` succeeds for all packages

### 2.2 Create .dockerignore
- [x] Create `.dockerignore` at repo root
- [x] Exclude node_modules, .next, dist, docs, .git

**Test:** File exists and is properly formatted

### 2.3 Create API Dockerfile
- [ ] Create `docker/api.Dockerfile`
- [ ] Multi-stage build: builder → runner
- [ ] Install pnpm, build types → agent → api
- [ ] Production stage with minimal dependencies

**Test:** `docker build -f docker/api.Dockerfile .` succeeds

### 2.4 Create Web Dockerfile
- [ ] Create `docker/web.Dockerfile`
- [ ] Multi-stage build with Next.js standalone output
- [ ] Handle NEXT_PUBLIC_API_URL build arg

**Test:** `docker build -f docker/web.Dockerfile .` succeeds

### 2.5 Create docker-compose.yml
- [ ] Create `docker-compose.yml` for production
- [ ] Define api service with healthcheck
- [ ] Define web service depending on api
- [ ] Configure environment variables from .env

**Test:** `docker compose up --build` starts both services, health endpoint responds

### 2.6 Create docker-compose.dev.yml
- [ ] Create `docker-compose.dev.yml` development override
- [ ] Mount source volumes for hot reload
- [ ] Use builder stage targets

**Test:** `docker compose -f docker-compose.yml -f docker-compose.dev.yml up` works with hot reload

---

## Phase 3: @space-weather/types Package (Full Implementation)

### 3.1 Implement Kp and solar wind schemas
- [ ] Create `packages/types/src/kp.ts` with KpReading and KpHistoryResponse schemas
- [ ] Create `packages/types/src/solar-wind.ts` with SolarWindReading and history response schemas
- [ ] Update `packages/types/src/index.ts` to re-export

**Test:** Unit tests validate schema encoding/decoding with sample data

### 3.2 Implement status schema
- [ ] Create `packages/types/src/status.ts` with StatusResponse schema (kp, gScale, bz, bt, wind speed/density, x-ray, proton flux)

**Test:** Unit tests validate schema with complete and partial data

### 3.3 Implement event schemas
- [ ] Create `packages/types/src/events.ts` with EventType, EventSeverity, SpaceWeatherEvent schemas

**Test:** Unit tests validate event types (SOLAR_FLARE, CME, GEOMAGNETIC_STORM, HIGH_SPEED_STREAM, ALERT)

### 3.4 Implement aurora and forecast schemas
- [ ] Create `packages/types/src/aurora.ts` with aurora forecast response schema
- [ ] Create `packages/types/src/forecast.ts` with 3-day forecast schema

**Test:** Unit tests validate both schemas

### 3.5 Implement imagery and agent schemas
- [ ] Create `packages/types/src/imagery.ts` with imagery response schema
- [ ] Create `packages/types/src/agent.ts` with AgentRequest and AgentResponse schemas

**Test:** Unit tests validate all schemas, full package builds

### 3.6 Verify Docker still builds with full types
- [ ] Rebuild Docker images with complete types package
- [ ] Verify no regressions

**Test:** `docker compose build` succeeds

---

## Phase 4: @space-weather/api Package - Infrastructure

### 4.1 Implement error types
- [ ] Create `packages/api/src/errors.ts` with UpstreamError, ParseError, CacheError tagged errors

**Test:** Unit tests verify error construction and type discrimination

### 4.2 Implement CacheService
- [ ] Create `packages/api/src/services/CacheService.ts` with in-memory TTL cache
- [ ] Implement `getOrFetch` with configurable TTL strings ("1m", "3h", etc.)

**Test:** Unit tests verify cache hits, misses, expiration, and TTL parsing

### 4.3 Implement timestamp and Kp normalizers
- [ ] Create `packages/api/src/normalizers/timestamp.ts` for ISO timestamp normalization
- [ ] Create `packages/api/src/normalizers/kp.ts` for Kp value normalization (clamp 0-9)
- [ ] Create `packages/api/src/normalizers/events.ts` for event normalization

**Test:** Unit tests verify normalization edge cases

### 4.4 Verify Docker builds with API infrastructure
- [ ] Rebuild Docker images
- [ ] Verify API container starts and health check passes

**Test:** `docker compose up api` succeeds

---

## Phase 5: @space-weather/api Package - Upstream Clients

### 5.1 Implement NOAA SWPC client
- [ ] Create `packages/api/src/clients/NoaaSwpcClient.ts`
- [ ] Implement `fetchKpHistory()` - planetary Kp index
- [ ] Implement `fetchSolarWind()` - real-time solar wind
- [ ] Implement `fetchXrayFlux()` - X-ray flux data
- [ ] Implement `fetchProtonFlux()` - proton event data

**Test:** Integration tests against live NOAA endpoints (with mocks for unit tests)

### 5.2 Implement GFZ Potsdam client
- [ ] Create `packages/api/src/clients/GfzClient.ts`
- [ ] Implement `fetchCurrentKp()` - nowcast Kp from GFZ

**Test:** Integration test against GFZ endpoint

### 5.3 Implement NASA DONKI client
- [ ] Create `packages/api/src/clients/NasaDonkiClient.ts`
- [ ] Implement `fetchCMEs()` - coronal mass ejections
- [ ] Implement `fetchFlares()` - solar flare events
- [ ] Implement `fetchGeomagneticStorms()` - storm events

**Test:** Integration tests with DEMO_KEY (rate limited)

### 5.4 Implement Helioviewer client
- [ ] Create `packages/api/src/clients/HelioviewerClient.ts`
- [ ] Implement `fetchLatestImages()` - SDO/SOHO imagery URLs

**Test:** Integration test fetching image metadata

### 5.5 Implement NCEI SPOT client
- [ ] Create `packages/api/src/clients/NceiSpotClient.ts`
- [ ] Implement `searchHistory()` - historical event archive search

**Test:** Integration test with date range query

---

## Phase 6: @space-weather/api Package - Services

### 6.1 Implement StatusService
- [ ] Create `packages/api/src/services/StatusService.ts`
- [ ] Aggregate current Kp, Bz, Bt, solar wind, X-ray, proton flux into StatusResponse
- [ ] Add 1-minute cache TTL

**Test:** Unit tests with mocked clients; integration test via `/api/status`

### 6.2 Implement KpService
- [ ] Create `packages/api/src/services/KpService.ts`
- [ ] Merge NOAA history with GFZ nowcast tip
- [ ] Add 3-hour cache TTL

**Test:** Unit tests verify merging logic; integration test via `/api/kp-history`

### 6.3 Implement SolarWindService
- [ ] Create `packages/api/src/services/SolarWindService.ts`
- [ ] Fetch and normalize 24h solar wind history
- [ ] Add 1-minute cache TTL

**Test:** Unit and integration tests

### 6.4 Implement AuroraService
- [ ] Create `packages/api/src/services/AuroraService.ts`
- [ ] Fetch OVATION aurora forecast data
- [ ] Add 30-minute cache TTL

**Test:** Unit and integration tests

### 6.5 Implement EventService
- [ ] Create `packages/api/src/services/EventService.ts`
- [ ] Aggregate events from DONKI and SWPC
- [ ] Normalize to SpaceWeatherEvent type
- [ ] Add 5-minute cache TTL

**Test:** Unit tests verify event normalization; integration test via `/api/events/recent`

### 6.6 Implement ForecastService
- [ ] Create `packages/api/src/services/ForecastService.ts`
- [ ] Fetch 3-day Kp and storm scale forecast
- [ ] Add 6-hour cache TTL

**Test:** Unit and integration tests

### 6.7 Implement ImageryService
- [ ] Create `packages/api/src/services/ImageryService.ts`
- [ ] Fetch latest solar imagery URLs
- [ ] Add 15-minute cache TTL

**Test:** Unit and integration tests

### 6.8 Implement HistoryService
- [ ] Create `packages/api/src/services/HistoryService.ts`
- [ ] Support search params: start, end, type, limit, offset
- [ ] Add 1-hour cache TTL

**Test:** Unit and integration tests with various query combinations

---

## Phase 7: @space-weather/api Package - HTTP Layer

### 7.1 Implement HTTP router
- [ ] Create `packages/api/src/router.ts` with all route definitions
- [ ] Parse query parameters for each endpoint
- [ ] Return typed JSON responses

**Test:** Integration tests for all 9 endpoints with various params

### 7.2 Implement layer composition
- [ ] Create `packages/api/src/layers.ts`
- [ ] Compose ClientLayer, CacheLayer, ServiceLayer
- [ ] Export AppLayer for server entry point

**Test:** Server starts with all layers wired correctly

### 7.3 Add error handling middleware
- [ ] Map SpaceWeatherError types to appropriate HTTP status codes
- [ ] Return structured error responses

**Test:** Integration tests verify error responses (400, 500, etc.)

### 7.4 Docker verification checkpoint
- [ ] Rebuild and test full API in Docker
- [ ] Verify all endpoints respond correctly in container

**Test:** `docker compose up api` and curl all endpoints

---

## Phase 8: @space-weather/agent Package

### 8.1 Implement zodiac context
- [ ] Create `packages/agent/src/zodiac.ts` with ZODIAC_TRAITS for all 12 signs
- [ ] Implement `getZodiacContext()` function

**Test:** Unit tests verify context generation for each sign

### 8.2 Implement system prompt
- [ ] Create `packages/agent/src/prompts.ts` with SYSTEM_PROMPT
- [ ] Include space weather expert persona and zodiac reading guidelines

**Test:** Verify prompt is well-formed string

### 8.3 Implement agent tools
- [ ] Create `packages/agent/src/tools/index.ts` - tool registry
- [ ] Create `packages/agent/src/tools/getCurrentKp.ts`
- [ ] Create `packages/agent/src/tools/getSolarWind.ts`
- [ ] Create `packages/agent/src/tools/getAuroraForecast.ts`
- [ ] Create `packages/agent/src/tools/getRecentEvents.ts`
- [ ] Create `packages/agent/src/tools/getKpHistory.ts`

**Test:** Unit tests verify each tool executes against mocked services

### 8.4 Implement agentic loop
- [ ] Create `packages/agent/src/loop.ts`
- [ ] Handle tool_use stop reason with parallel tool execution
- [ ] Handle end_turn stop reason
- [ ] Implement MAX_ROUNDS limit
- [ ] Track toolsUsed across recursion

**Test:** Integration test with mock Anthropic client verifying loop behavior

### 8.5 Implement AgentService
- [ ] Create `packages/agent/src/AgentService.ts`
- [ ] Wire prompt, zodiac context, and agentic loop
- [ ] Export AgentServiceLive layer

**Test:** Integration test with real Anthropic API (requires ANTHROPIC_API_KEY)

### 8.6 Wire /api/ask endpoint
- [ ] Update `packages/api/src/router.ts` to handle POST /api/ask
- [ ] Parse AgentRequest body
- [ ] Return AgentResponse

**Test:** End-to-end test: POST prompt → agent runs tools → returns synthesized response

### 8.7 Docker verification with agent
- [ ] Rebuild Docker images with agent package
- [ ] Test /api/ask endpoint in container

**Test:** `docker compose up` and test agent endpoint

---

## Phase 9: @space-weather/web Package - Setup & Lib

### 9.1 Set up Tailwind and global styles
- [ ] Create `packages/web/tailwind.config.ts` (if not already complete)
- [ ] Create global CSS with Tailwind directives
- [ ] Configure dark mode support

**Test:** Styles apply correctly

### 9.2 Implement root layout with providers
- [ ] Update `packages/web/src/app/layout.tsx` with TanStack QueryClientProvider
- [ ] Add navigation structure
- [ ] Set up metadata

**Test:** Layout renders without errors

### 9.3 Implement API client library
- [ ] Create `packages/web/src/lib/api.ts` with typed fetch wrappers
- [ ] Create `packages/web/src/lib/queryClient.ts`
- [ ] Implement `fetchAndDecode()` with schema validation

**Test:** Unit tests verify fetch wrapper behavior with mocked responses

### 9.4 Implement color utilities
- [ ] Create `packages/web/src/lib/colors.ts` with Kp color scale
- [ ] Add G-scale to color mapping

**Test:** Unit tests verify color mapping for all Kp values

---

## Phase 10: @space-weather/web Package - Data Hooks

### 10.1 Implement useStatus hook
- [ ] Create `packages/web/src/hooks/useStatus.ts`
- [ ] Configure 1-minute refetch interval

**Test:** Hook returns loading/data/error states correctly

### 10.2 Implement useKpHistory hook
- [ ] Create `packages/web/src/hooks/useKpHistory.ts`
- [ ] Accept hours parameter
- [ ] Configure 3-hour refetch interval

**Test:** Hook fetches and caches data correctly

### 10.3 Implement remaining data hooks
- [ ] Create `packages/web/src/hooks/useSolarWind.ts`
- [ ] Create `packages/web/src/hooks/useAurora.ts`
- [ ] Create `packages/web/src/hooks/useEvents.ts`
- [ ] Create `packages/web/src/hooks/useForecast.ts`

**Test:** All hooks function correctly with mocked API

---

## Phase 11: @space-weather/web Package - UI Components

### 11.1 Implement base UI components
- [ ] Create `packages/web/src/components/ui/GlowDot.tsx` - pulsing status indicator
- [ ] Create `packages/web/src/components/ui/StormBadge.tsx` - G-scale badge

**Test:** Components render with various props

### 11.2 Implement StatusBar component
- [ ] Create `packages/web/src/components/dashboard/StatusBar.tsx`
- [ ] Display current Kp, G-scale, solar wind summary

**Test:** Component renders with mock status data

### 11.3 Implement MetricCard component
- [ ] Create `packages/web/src/components/dashboard/MetricCard.tsx`
- [ ] Reusable card for displaying individual metrics

**Test:** Component renders with various metric types

### 11.4 Implement KpChart component
- [ ] Create `packages/web/src/components/dashboard/KpChart.tsx`
- [ ] Use Recharts for 24h Kp line/bar chart
- [ ] Color bars by storm level

**Test:** Chart renders with sample Kp data

### 11.5 Implement SolarWindChart component
- [ ] Create `packages/web/src/components/dashboard/SolarWindChart.tsx`
- [ ] Multi-line chart for speed, density, Bz

**Test:** Chart renders with sample solar wind data

### 11.6 Implement AuroraMap component
- [ ] Create `packages/web/src/components/dashboard/AuroraMap.tsx`
- [ ] Display aurora probability visualization

**Test:** Component renders with aurora forecast data

### 11.7 Implement EventFeed component
- [ ] Create `packages/web/src/components/dashboard/EventFeed.tsx`
- [ ] List recent events with severity badges

**Test:** Component renders event list with various event types

### 11.8 Implement ForecastBar component
- [ ] Create `packages/web/src/components/dashboard/ForecastBar.tsx`
- [ ] Display 3-day forecast summary

**Test:** Component renders with forecast data

---

## Phase 12: @space-weather/web Package - Agent Components

### 12.1 Implement SignSelector component
- [ ] Create `packages/web/src/components/agent/SignSelector.tsx`
- [ ] Display all 12 zodiac signs
- [ ] Handle selection state

**Test:** Component renders, selection works

### 12.2 Implement CosmicReading component
- [ ] Create `packages/web/src/components/agent/CosmicReading.tsx`
- [ ] Integrate SignSelector
- [ ] Call /api/ask and display result
- [ ] Handle loading and error states

**Test:** Component flow works end-to-end

---

## Phase 13: @space-weather/web Package - Pages

### 13.1 Implement Overview page (home)
- [ ] Create `packages/web/src/app/page.tsx`
- [ ] Compose StatusBar, KpChart, MetricCards
- [ ] Wire up data hooks

**Test:** Page renders with live or mocked data

### 13.2 Implement Solar Wind page
- [ ] Create `packages/web/src/app/solar-wind/page.tsx`
- [ ] Full-page SolarWindChart with controls

**Test:** Page renders and updates

### 13.3 Implement Aurora page
- [ ] Create `packages/web/src/app/aurora/page.tsx`
- [ ] AuroraMap with forecast details

**Test:** Page renders aurora visualization

### 13.4 Implement Events page
- [ ] Create `packages/web/src/app/events/page.tsx`
- [ ] EventFeed with filtering options

**Test:** Page renders and filters work

### 13.5 Implement Reading page
- [ ] Create `packages/web/src/app/reading/page.tsx`
- [ ] CosmicReading component integration

**Test:** Full zodiac reading flow works

### 13.6 Full stack Docker verification
- [ ] Rebuild all Docker images
- [ ] Test complete application in Docker
- [ ] Verify frontend communicates with API correctly

**Test:** `docker compose up --build` and navigate all pages

---

## Phase 14: Documentation Automation

### 14.1 Create docs directory structure
- [ ] Create `docs/README.md`
- [ ] Create `docs/architecture.md`
- [ ] Create `docs/data-sources.md`
- [ ] Create `docs/api/overview.md` and endpoint docs

**Test:** Documentation is readable and accurate

### 14.2 Implement doc update agent script
- [ ] Create `scripts/doc-update-agent.py`
- [ ] Parse git diff to identify changed files
- [ ] Call Claude to determine doc updates needed
- [ ] Generate PR with documentation changes

**Test:** Script runs locally with sample diff

### 14.3 Create GitHub Actions workflow
- [ ] Create `.github/workflows/update-docs.yml`
- [ ] Trigger on push to main
- [ ] Run doc-update-agent.py
- [ ] Open PR with changes

**Test:** Workflow syntax is valid (use `act` or GitHub's workflow validator)

### 14.4 Add @doc JSDoc tags to source
- [ ] Add `@doc` tags to key services and types
- [ ] Link to corresponding documentation files

**Test:** Tags are present and paths are correct

---

## Phase 15: Final Integration & Polish

### 15.1 End-to-end integration tests
- [ ] Test full data flow: upstream API → backend → frontend
- [ ] Test agent reading generation
- [ ] Test all API endpoints

**Test:** All integration tests pass

### 15.2 Cross-browser testing
- [ ] Test dashboard in Chrome, Firefox, Safari
- [ ] Verify responsive design

**Test:** No visual or functional issues

### 15.3 Performance review
- [ ] Verify cache TTLs are working
- [ ] Check bundle sizes
- [ ] Review API response times

**Test:** Performance meets expectations

### 15.4 Security review
- [ ] Verify API keys are not exposed
- [ ] Check for XSS vulnerabilities in agent responses
- [ ] Validate all user inputs

**Test:** Security checklist passes

---

## Summary

| Phase | Tasks | Focus Area |
|-------|-------|------------|
| 1 | 1 | Monorepo setup |
| 2 | 6 | Docker + package stubs (early validation) |
| 3 | 6 | Types package (full) |
| 4 | 4 | API infrastructure |
| 5 | 5 | Upstream clients |
| 6 | 8 | API services |
| 7 | 4 | HTTP layer |
| 8 | 7 | Agent package |
| 9 | 4 | Web setup |
| 10 | 3 | Data hooks |
| 11 | 8 | UI components |
| 12 | 2 | Agent components |
| 13 | 6 | Pages + Docker verification |
| 14 | 4 | Docs automation |
| 15 | 4 | Integration |

**Total: 72 tasks**

Docker checkpoints are embedded at:
- **Phase 2**: Initial Docker setup with minimal stubs
- **Phase 3.6**: Verify after types completion
- **Phase 4.4**: Verify after API infrastructure
- **Phase 7.4**: Verify after full API implementation
- **Phase 8.7**: Verify after agent integration
- **Phase 13.6**: Final full-stack Docker verification
