import _ from 'lodash'
import { hooks } from '@kalisio/krawler'

const timeout = parseInt(process.env.TIMEOUT, 10) || (60 * 60 * 1000) // duration in miliseconds
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const baseUrl = 'https://api.openaq.org/v2/latest?'
const ttl = parseInt(process.env.TTL, 10) || 7 * 24 * 60 * 60 // in seconds
const queryLimit = parseInt(process.env.QUERY_LIMIT, 10) || 1000
//const countries = [ 'FR', 'BE', 'LU', 'CH' ]
// In the v2 of the API the countries are identified by an id, but there's no direct way to get id for a country other than
// trying id and check country name ...
// cf https://docs.openaq.org/reference/countries_get_v2_countries_get
const countriesIds = process.env.COUNTRIES_IDS && process.env.COUNTRIES_IDS.split(',') || [ '2', '134', '133', '132']

// In the v2 of the API we can no longuer add multiple parameters in one query, so we filter the results afterwards
const variables = process.env.VARIABLES && process.env.VARIABLES.split(',') || [ 'pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc']

// Helper function to create the indexes for each variables
function generateIndexes () {
  let indexes  = []
  variables.forEach( variable => {
    let key = `properties.${variable}`
    let index = [ { 'properties.country': 1, 'properties.location': 1, [key] : 1, time: -1 }, { background: true } ]
    indexes.push(index)
  })
  return indexes
}

// Helper function to generate a location name
function generateLocation (station) {
  const location = station.location
  const longitude = station.coordinates.longitude
  const latitude = station.coordinates.latitude
  return location ? location : `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
}

// Create a custom hook to generate tasks
// We no longuer use the parameters of the variables in the query as it is more efficient to filter the results afterwards
let generateTasks = (options) => {
  return (hook) => {
    let tasks = []
    countriesIds.forEach(country_id => {
      let task = {
        id: country_id,
        options: {
          url: baseUrl + 'country_id=' + country_id + '&limit=' + queryLimit
        }
      }
      console.log('Generating task for country ' + country_id, "   url: " + task.options.url)
      tasks.push(task)
    })

    hook.data.tasks = tasks
    return hook
  }
}
hooks.registerHook('generateTasks', generateTasks)

export default {
  id: 'openaq',
  store: 'memory',
  options: {
    workersLimit: 1,
    faultTolerant: false,
    timeout: timeout
  },
  taskTemplate: {
    id: 'openaq/<%= taskId %>',
    type: 'http'
  },
  hooks: {
    tasks: {
      after: {
        readJson: {
          dataPath: 'data.openaqResponse'
        },
        generateStations: {
          hook: 'apply',
          function: (item) => {
            let stationCollection = []
            let stations = item.openaqResponse.results
            stations.forEach(station => {
              // ensure the station has some coordinates
              const longitude = _.get(station, 'coordinates.longitude')
              const latitude = _.get(station, 'coordinates.latitude')
              if (longitude && latitude) {
                const location = generateLocation(station)
                let stationFeature = {
                  type: 'Feature',
                  geometry: {
                    type: 'Point',
                    coordinates: [ longitude, latitude ]
                  },
                  properties: {
                    name: location + station.city ? ' [' + station.city + ']' : '',
                    country: station.country,
                    location: location
                  }
                }
                console.log(location)
                stationCollection.push(stationFeature)
              } else {
                console.warn('[!] invalid station: no coordinates', station)
              }
            })
            item.data = stationCollection
          }
        },
        writeStations: {
          hook: 'updateMongoCollection',
          collection: 'openaq-stations',
          filter: {
            'properties.country': '<%= properties.country %>',
            'properties.location': '<%= properties.location %>'
          },
          upsert : true,
          chunkSize: 256
        },
        generateMeasurements: {
          hook: 'apply',
          function: (item) => {
            let measurementCollection = []
            let stations = item.openaqResponse.results
            stations.forEach(station => {
              const longitude = _.get(station, 'coordinates.longitude')
              const latitude = _.get(station, 'coordinates.latitude')
              if (longitude && latitude) {
                const location = generateLocation(station)
                station.measurements.forEach( measurement => {
                  // We only keep the measurements for the variables we are interested in
                  if (variables.includes(measurement.parameter)) {
                    let measurementFeature = {
                      type: 'Feature',
                      time: measurement.lastUpdated,
                      geometry: {
                        type: 'Point',
                        coordinates: [ longitude, latitude ]
                      },
                      properties: {
                        name: station.location + ' [' + station.city + ']',
                        country: station.country,
                        location: location,
                        variable: measurement.parameter,
                        [measurement.parameter]: measurement.value,
                        unit: measurement.unit,
                        lastUpdated: measurement.lastUpdated,
                        sourceName: measurement.sourceName,
                        averagingPeriod: measurement.averagingPeriod
                      }
                    }
                    measurementCollection.push(measurementFeature)
                  }
                })
              } else {
                console.warn('[!] invalid station: no coordinates', station)
              }
            })
            item.data = measurementCollection
          }
        },
        writeMeasurements: {
          hook: 'updateMongoCollection',
          collection: 'openaq-measurements',
          filter: {
            time: '<%= time.toISOString() %>',
            'properties.country': '<%= properties.country %>',
            'properties.location': '<%= properties.location %>',
            'properties.variable': '<%= properties.variable %>'
          },
          upsert : true,
          transform: { unitMapping: { time: { asDate: 'utc' } } },
          chunkSize: 256
        },
        clearData: {}
      }
    },
    jobs: {
      before: {
        createStores: { id: 'memory'},
        connectMongo: {
          url: dbUrl,
          // Required so that client is forwarded from job to tasks
          clientPath: 'taskTemplate.client'
        },
        createStationsCollection: {
          hook: 'createMongoCollection',
          clientPath: 'taskTemplate.client',
          collection: 'openaq-stations',
          indices: [
            [{ 'properties.country': 1, 'properties.location': 1 }, { unique: true }],
            { geometry: '2dsphere' }
          ]
        },
        createMeasurementsCollection: {
          hook: 'createMongoCollection',
          clientPath: 'taskTemplate.client',
          collection: 'openaq-measurements',
          indices: generateIndexes().concat([
            [{ time: 1, 'properties.country': 1, 'properties.location': 1, 'properties.variable': 1 }, { unique: true }],
            [{ 'properties.country': 1, 'properties.location': 1, time: -1 }, { background: true }],
            [{ time: 1 }, { expireAfterSeconds: ttl }], // days in s
            { geometry: '2dsphere' }
          ]),
        },
        generateTasks: {}
      },
      after: {
        disconnectMongo: {
          clientPath: 'taskTemplate.client'
        },
        removeStores: ['memory']
      },
      error: {
        disconnectMongo: {
          clientPath: 'taskTemplate.client'
        },
        removeStores: ['memory']
      }
    }
  }
}
