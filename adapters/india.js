'use strict';

var request = require('request');
var _ = require('lodash');

exports.name = 'india';

exports.fetchData = function (url, cb) {
  var finalURL = url + '?apitoken=' + process.env.INDIA_KIMONO_TOKEN;
  request(finalURL, function (err, res, body) {
    if (err || res.statusCode !== 200) {
      console.error(err || res);
      return cb({message: 'Failure to load data url.'});
    }

    // Format the data
    var data = formatData(body);

    // Make sure the data is valid
    if (data === undefined) {
      return cb({message: 'Failure to parse data.'});
    }
    cb(null, data);
  });
};

var formatData = function (data) {
  // Wrap the JSON.parse() in a try/catch in case it fails
  try {
    data = JSON.parse(data);
  } catch (e) {
    // Return undefined to be caught elsewhere
    return undefined;
  }

  var getValue = function (measuredValue) {
    var idx = measuredValue.indexOf(' ');
    return {
      value: measuredValue.substring(0, idx),
      unit: measuredValue.substring(idx + 1, measuredValue.length)
    };
  };

  // Filter out measurements with no value
  var filtered = _.filter(data.results.collection1, function (m) {
    return getValue(m.measuredValue).value !== '';
  });

  // Build up pretty measurements array
  var measurements = _.map(filtered, function (m) {
    var valueObj = getValue(m.measuredValue);

    // Manually adding offset, find a better way to do this
    var date = new Date(m.date + ' ' + m.time + ' GMT+0530');
    return {
      parameter: m.parameter.text,
      date: date,
      value: valueObj.value,
      unit: valueObj.unit
    };
  });
  var parsed = {
    'name': data.name,
    'measurements': measurements
  };
  return parsed;
};