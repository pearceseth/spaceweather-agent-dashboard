/**
 * @space-weather/api - Effect-TS HTTP backend
 */
import { HttpRouter, HttpServer, HttpServerResponse } from "@effect/platform"
import { NodeHttpServer, NodeRuntime } from "@effect/platform-node"
import { Effect, Layer } from "effect"
import { createServer } from "node:http"

const PORT = Number(process.env["PORT"]) || 3001

/**
 * Health check endpoint for Docker/K8s probes
 */
const healthRoute = HttpRouter.get("/health", HttpServerResponse.json({ status: "ok" }))

const router = HttpRouter.empty.pipe(healthRoute)

const ServerLive = router.pipe(
  HttpServer.serve(),
  Layer.provide(NodeHttpServer.layer(createServer, { port: PORT }))
)

Effect.log(`Starting server on port ${PORT}`).pipe(
  Effect.flatMap(() => Layer.launch(ServerLive)),
  NodeRuntime.runMain
)
