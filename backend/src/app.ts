import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import routes from "./routes/index";
import logger from "./config/logger";
import { env } from "./config/env";
import notFound from "./middleware/not-found";
import errorHandler from "./middleware/error-handler";

const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");

  app.use(
    pinoHttp({
      logger,
      autoLogging: !env.isTest,
    })
  );

  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:8100', 'http://localhost:4200'],
    credentials: true
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
