import bunyan from "bunyan";

export function logger(name, filePath, logToConsole) {
  let streams = [];

  if (logToConsole) {
    streams.push({
      level: "info",
      stream: process.stdout
    });
  }

  streams.push({
    type: "rotating-file",
    path: filePath,
    period: "1d", // daily rotation
    count: 10 // keep 3 back copies
  });

  const logger = bunyan.createLogger({
    name: name,
    streams: streams
  });

  // Reopen file streams on signal
  process.on("SIGUSR2", function() {
    logger.reopenFileStreams();
  });

  return logger;
};

export function middleware (loggerInstance) {
  return function accessLogMiddleware(req, res, next) {
    // This doesn't fire the log immediately, but waits until the response is finished
    // This means we have a chance of logging the response code
    res.on("finish", () => {
      loggerInstance.info({
        remoteAddress: req.ip,
        method: req.method,
        url: req.originalUrl,
        protocol: req.protocol,
        hostname: req.hostname,
        httpVersion: `${req.httpVersionMajor}.${req.httpVersionMinor}`,
        userAgent: req.headers["user-agent"],
        status: res._header ? res.statusCode : undefined
      }, "access_log");
    });
    next();
  };
};
