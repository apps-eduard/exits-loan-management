import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import routes from "./routes/index";
import logger from "./config/logger";
import { env } from "./config/env";
import notFound from "./middleware/not-found";
import errorHandler from "./middleware/error-handler";
import requestLogger from "./middleware/request-logger";

const createApp = (): Application => {
  const app = express();

  app.disable("x-powered-by");

  // Disable pino-http auto logging in development to keep console clean
  // Our custom request logger provides better formatting
  if (!env.isTest && !env.isDevelopment) {
    app.use(
      pinoHttp({
        logger,
        autoLogging: true,
      })
    );
  }

  app.use(helmet());
  app.use(cors({
    origin: ['http://localhost:8100', 'http://localhost:8101', 'http://localhost:4200'],
    credentials: true
  }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));

  // Add request logger in development
  if (env.isDevelopment) {
    app.use(requestLogger);
  }

  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp;
