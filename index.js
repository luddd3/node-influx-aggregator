'use strict'
const R = require('ramda')

const SECONDS = 1000
let defaultOptions = {
  interval: 5 * SECONDS,
  error: function () {}
}

module.exports = function (influxClient, opts) {
  let options = R.merge(defaultOptions, opts || {})

  let timer = null
  let series = null

  let _write = function () {
    if (series) {
      influxClient.writeSeries(series, options.error)
      series = null
    }
    timer = null
  }

  let _mayStartTimer = function () {
    if (!timer) {
      _write()
      timer = setTimeout(_write, options.interval)
    }
  }

  let _withTimestamp = function (points) {
    return points.map(function (point) {
      return [R.merge({time: new Date()}, point[0]), point[1]]
    })
  }

  let _append = function (seriesName, points) {
    if (!series) {
      series = {}
    }
    if (!series[seriesName]) {
      series[seriesName] = []
    }
    let pointsWithTime = _withTimestamp(points)
    series[seriesName] = series[seriesName].concat(pointsWithTime)
    _mayStartTimer()
  }

  return {
    writePoint: function (seriesName, point, tags) {
      if (typeof seriesName !== 'string') {
        throw new Error('writePoint expected seriesName to be a string.')
      }
      if (typeof point !== 'object') {
        throw new Error('writePoint expected point to be an object.')
      }
      if (typeof tags !== 'object') {
        throw new Error('writePoint expected tags to be an object.')
      }
      _append(seriesName, [[point, tags]])
    },

    writePoints: function (seriesName, points) {
      if (typeof seriesName !== 'string') {
        throw new Error('writePoints expected seriesName to be a string.')
      }
      if (!Array.isArray(points)) {
        throw new Error('writePoints expected points to be an array.')
      }
      _append(seriesName, points)
    }
  }
}

