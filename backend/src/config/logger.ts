import pino from "pino";
import { env } from "./env";

const transport = env.isDevelopment
  ? {
      target: "pino-pretty",
      options: {
        colorize: true,
        singleLine: true,
        translateTime: "HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    }
  : undefined;

const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    environment: env.NODE_ENV,
  },
});

export default logger;
