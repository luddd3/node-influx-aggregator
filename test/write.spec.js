'use strict'
let R = require('ramda')
let expect = require('expect')
let InfluxAggregator = require('../')

describe('InfluxAggregator', () => {
  let influxClient
  let results

  beforeEach(() => {
    results = []
    let influx = { 
      writeSeries: function (series, cb) {
        results.push(R.clone(series))
      }
    }
    influxClient = InfluxAggregator(influx, {interval: 10})
  })

  it('can do single writePoint', () => {
    var timestamp = new Date()
    influxClient.writePoint('mySeries', {v: 1, time: timestamp}, {t: 'tag'})
    expect(results.length).toEqual(1)
    expect(results[0]).toEqual({
      mySeries: [[{v: 1, time: timestamp}, {t: 'tag'}]]
    })
  })

  it('waits interval time after first writePoint', (done) => {
    var timestamp = new Date()
    influxClient.writePoint('mySeries', {v: 1, time: timestamp}, {t: 'tag'})
    influxClient.writePoint('mySeries', {v: 2, time: timestamp}, {t: 'tag2'})
    setTimeout(() => {
      expect(results.length).toEqual(1)
    }, 1)
    setTimeout(() => {
      expect(results).toEqual([
          {
            mySeries: [[{v: 1, time: timestamp}, {t: 'tag'}]]
          },
          {
            mySeries: [[{v: 2, time: timestamp}, {t: 'tag2'}]]
          }
      ])
      return done()
    }, 15)
  })

  it('buffers the consecutive writePoint within interval', (done) => {
    var timestamp = new Date()
    influxClient.writePoint('first', {v: 1, time: timestamp}, {t: 'tag'})
    influxClient.writePoint('second', {v: 2, time: timestamp}, {t: 'tag2'})
    influxClient.writePoint('third', {v: 3, time: timestamp}, {t: 'tag3'})
    setTimeout(() => {
      expect(results).toEqual([
          {
            first: [[{v: 1, time: timestamp}, {t: 'tag'}]]
          },
          {
            second: [[{v: 2, time: timestamp}, {t: 'tag2'}]],
            third: [[{v: 3, time: timestamp}, {t: 'tag3'}]]
          }
      ])
      return done()
    }, 15)
   })

  it('appends timestamp to writePoint', () => {
    influxClient.writePoint('first', {v: 1}, {t: 'tag'})
    expect(results[0].first[0][0].time).toBeA(Date)
  })

  it('can do single writePoints', () => {
    var timestamp = new Date()
    influxClient.writePoints('first', [
      [{v: 1, time: timestamp}, {t: 't1'}],
      [{v: 2, time: timestamp}, {t: 't2'}]
    ])
    expect(results.length).toEqual(1)
    expect(results[0]).toEqual({
      first: [
        [{v: 1, time: timestamp}, {t: 't1'}],
        [{v: 2, time: timestamp}, {t: 't2'}]
      ]
    })
  })

  it('can do multiple writePoints', () => {
    var timestamp = new Date()
    influxClient.writePoints('first', [
      [{v: 1, time: timestamp}, {t: 't1'}],
      [{v: 2, time: timestamp}, {t: 't2'}]
    ])
  })

  it('throws error when seriesName is missing', () => {
    expect(() => {
      influxClient.writePoint({value: 1}, {hostname: 'mathias'})
    }).toThrow(
      'writePoint expected seriesName to be a string.'
    )
  })

  it('appends timestamp to writePoints', () => {
    influxClient.writePoints('first', [
      [{v: 1}, {t: 't1'}],
      [{v: 2}, {t: 't2'}]
    ])
    expect(results[0].first[0][0].time).toBeA(Date)
    expect(results[0].first[1][0].time).toBeA(Date)
  })
})

