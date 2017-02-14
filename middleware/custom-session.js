/* jslint node: true */
"use strict";

module.exports = function customSession(Department, Session, User) {
  var _ = require('lodash');

  var departmentForLogging = function(department) {
    if (!_.isObject(department)) {
      return {};
    }

    var item = _.pick(_.clone(department), ['_id', 'id', 'department', 'cadBidirectionalEnabled']);
    return JSON.parse(JSON.stringify(item)); // Force convert the item to JSON
  };

  var getSession = function(req, res, callback) {
    if (!_.isObject(req.cookies) || !_.isString(req.cookies['seneca-login'])) {
      return callback(null, null);
    }

    var query = {};
    query.token = req.cookies['seneca-login'];
    query.active = true;

    return Session.findOne(query, function(err, dbObject) {
      if (err) {
        console.log('err retrieving session', err);
      }

      if (_.isObject(dbObject) && _.size(dbObject) > 0) {
        req.login = dbObject.toObject();
        req.session = dbObject.toObject();
      }

      return callback(err, dbObject);
    });
  };

  var getUser = function(req, res, callback) {
    if (!_.isObject(req.login)) {
      return callback(null, null);
    }

    var session = req.login;
    if (!_.isString(session.user)) {
      return callback(null, null);
    }

    var query = {};
    query._id = session.user;
    query.active = true;

    return User.findOne(query, function(err, dbObject) {
      if (err) {
        console.log('err retrieving user', err);
      }

      if (_.isObject(dbObject) && _.size(dbObject) > 0) {
        req.user = dbObject.toObject();
      }

      return callback(err, dbObject);
    });
  };

  var getDepartmentByUser = function(req, res, callback) {
    if (!_.isObject(req.user)) {
      return callback(null, null);
    }

    var user = req.user;
    var departmentId = user.departmentId;
    var noUserDepartmentId = (!_.isString(departmentId) || departmentId === '');
    var isSuperUser = (user.superuser === true ||
      user.superuser === 'true' ||
      user.superuser === 1 ||
      user.superuser === '1'
    );

    var noQueryDepartmentId = true;
    if (noUserDepartmentId && _.isString(req.query.departmentId)) {
      noQueryDepartmentId = false;
      departmentId = req.query.departmentId;
    }

    if (isSuperUser && noUserDepartmentId && noQueryDepartmentId) {
      return callback(null, null);
    }

    return Department.findById(departmentId, function(err, dbObject) {
      if (err) {
        console.log('err retrieving department by user', err);
      }

      if (_.isObject(dbObject) && _.size(dbObject) > 0) {
        req.department = dbObject.toObject();
        req.departmentLog = departmentForLogging(dbObject.toJSON());
      }

      return callback(err, dbObject);
    });
  };

  var getDepartmentByApiKey = function(req, res, callback) {
    var apiKey = '';
    if (_.isObject(req.headers) && _.has(req.headers, 'apiKey')) {
      apiKey = req.headers.apiKey;
    } else if (_.isObject(req.headers) && _.has(req.headers, 'apikey')) {
      apiKey = req.headers.apikey;
    } else if (_.isObject(req.query) && _.has(req.query, 'apiKey')) {
      apiKey = req.query.apiKey;
    } else if (_.isObject(req.query) && _.has(req.query, 'apikey')) {
      apiKey = req.query.apikey;
    }

    if (apiKey === '') {
      return callback(null, null);
    }

    var query = {
      apikey: apiKey,
      active: true
    };

    return Department.findOne(query, function(err, dbObject) {
      if (err) {
        console.log('err retrieving department by user', err);
      }

      if (_.isObject(dbObject) && _.size(dbObject) > 0) {
        req.department = dbObject.toObject();
        req.departmentLog = departmentForLogging(dbObject.toJSON());
      }

      return callback(err, dbObject);
    });
  };

  return function(req, res, next) {
    return getDepartmentByApiKey(req, res, function(err, department) {
      if (!_.isNull(department) && _.size(department) > 0) {
        return next();
      }

      // Trying to resolve using a session cookie
      return getSession(req, res, function(err, session) {
        return getUser(req, res, function(err, user) {
          return getDepartmentByUser(req, res, function(err, department) {
            return next();
          });
        });
      });
    });
  };
};
