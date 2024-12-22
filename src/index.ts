import events from "node:events";
import type http from "node:http";
import type { OAuthClient } from "@atproto/oauth-client-node";
import express, { type Express } from "express";
import { pino } from "pino";

import type { Jetstream } from "@skyware/jetstream";
import { createClient } from "#/auth/client";
import { createDb, migrateToLatest } from "#/db/db";
import type { Database } from "#/db/db";
import {
  type BidirectionalResolver,
  createBidirectionalResolver,
  createIdResolver,
} from "#/id-resolver";
import { createIngester } from "#/ingester";
import { env } from "#/lib/env";
import { createRouter } from "#/routes/router";
import { AtprotoServiceAccount } from "./serviceAccount";

// Application state passed to the router and elsewhere
export type AppContext = {
  db: Database;
  ingester: Jetstream | undefined; // TODO: remove undefined as an option once we stop testing off ATP
  logger: pino.Logger;
  oauthClient: OAuthClient;
  resolver: BidirectionalResolver;
  atSvcAct: AtprotoServiceAccount;
};

export class Server {
  constructor(
    public app: express.Application,
    public server: http.Server,
    public ctx: AppContext
  ) {}

  static async create() {
    const { NODE_ENV, HOST, PORT, DB_PATH, LOG_LEVEL } = env;
    const logger = pino({ name: "server start", level: LOG_LEVEL });

    // Set up the SQLite database
    const db = createDb(DB_PATH);
    await migrateToLatest(db);

    // Create the atproto utilities
    const oauthClient = await createClient(db);
    const baseIdResolver = createIdResolver();
    const ingester = createIngester(db, baseIdResolver);
    const resolver = createBidirectionalResolver(baseIdResolver);
    const atSvcAct = await AtprotoServiceAccount.create(db, logger);
    const ctx: AppContext = {
      db,
      ingester,
      logger,
      oauthClient,
      resolver,
      atSvcAct,
    };

    // Subscribe to events on the firehose
    if (ingester) ingester.start();

    // Create our server
    const app: Express = express();
    app.set("trust proxy", true);

    // Routes & middlewares
    const router = createRouter(ctx);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(router);
    app.use((_req, res) => res.sendStatus(404));

    // Bind our server to the port
    const server = app.listen(env.PORT);
    await events.once(server, "listening");
    logger.info(`Server (${NODE_ENV}) running on port http://${HOST}:${PORT}`);

    return new Server(app, server, ctx);
  }

  async close() {
    this.ctx.logger.info("sigint received, shutting down");
    if (this.ctx.ingester) await this.ctx.ingester.close();
    return new Promise<void>((resolve) => {
      this.server.close(() => {
        this.ctx.logger.info("server closed");
        resolve();
      });
    });
  }
}

const run = async () => {
  const server = await Server.create();

  const onCloseSignal = async () => {
    setTimeout(() => process.exit(1), 10000).unref(); // Force shutdown after 10s
    await server.close();
    process.exit();
  };

  process.on("SIGINT", onCloseSignal);
  process.on("SIGTERM", onCloseSignal);
};

run();
