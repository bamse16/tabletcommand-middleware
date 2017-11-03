"use strict";

var session = require("./middleware/custom-session");
var signupSession = require("./middleware/signup-session");
var metrics = require("./middleware/metrics");
var tokenSession = require("./middleware/token-session");

var redis = require("./lib/redis");
var helpers = require("./lib/helpers");
var routesCommon = require("./routes/common");

module.exports = {
  session: session,
  signupSession: signupSession,
  metrics: metrics,
  tokenSession: tokenSession,

  redis: redis,
  helpers: helpers,
  routesCommon: routesCommon
};
