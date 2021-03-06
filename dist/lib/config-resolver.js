"use strict";

module.exports = function (dependencies) {
  var mongodbUri = require("mongodb-uri");
  var _ = require("lodash");

  function redisURL(str) {
    // URI format: redis://x:942t4dff@192.168.0.17:6379,192.168.0.18:1234
    var urlParts = null;
    try {
      urlParts = mongodbUri.parse(str);
    } catch (e) {}

    if (!_.isObject(urlParts)) {
      return str;
    }

    var hostPort = "localhost:6379"; // Default
    if (_.isArray(urlParts.hosts) && urlParts.hosts.length > 0) {
      var srv = urlParts.hosts[Math.floor(Math.random() * urlParts.hosts.length)];
      hostPort = srv.host + ":" + srv.port;
    } else {
      console.log("Could not determine Redis URL configuration from: " + str + ".");
    }

    return urlParts.scheme + "://" + urlParts.username + ":" + urlParts.password + "@" + hostPort;
  }

  return {
    redisURL: redisURL
  };
};