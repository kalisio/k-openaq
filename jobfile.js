import { hooks } from '@kalisio/krawler'

const timeout = parseInt(process.env.TIMEOUT) || (60 * 60 * 1000) // duration in miliseconds
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const baseUrl = 'https://api.openaq.org/v1/latest?'
const ttl = 7 * 24 * 60 * 60 // in seconds
const queryLimit = 1000
const countries = [ 'FR', 'AD', 'BE', 'LU', 'CH' ]
const variables = [ 'pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc']

console.log(hooks)

// Helper function tp create the indexes for each variables
function generateIndexes () {
	let indexes  = []
	variables.forEach( variable => {
		let key = `properties.${variable}`
		let index = [ { 'properties.country': 1, 'properties.location': 1, [key] : 1, time: -1 }, { background: true } ]
		indexes.push(index)
	})
	return indexes
}

// Create a custom hook to generate tasks
let generateTasks = (options) => {
  return (hook) => {
    let tasks = []
    countries.forEach(country => {
      variables.forEach(variable => {
        let task = {
        id: country + '_' + variable,
        variable,
        options: {
          url: baseUrl + 'country=' + country + '&parameter=' + variable + '&limit=' + queryLimit
          }
        }
        tasks.push(task)
      })
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
              let stationFeature = {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [ station.coordinates.longitude, station.coordinates.latitude ]
                },
                properties: {
                  name: station.location + ' [' + station.city + ']',
                  country: station.country,
                  location: station.location,
                }
              }
              stationCollection.push(stationFeature)
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
              station.measurements.forEach( measurement => {
                let measurementFeature = { 		  
                  type: 'Feature',
                  time: measurement.lastUpdated,
                  geometry: {
                    type: 'Point',
                    coordinates: [ station.coordinates.longitude, station.coordinates.latitude ]
                  },
                  properties: {
                    name: station.location + ' [' + station.city + ']',
                    country: station.country,
                    location: station.location,
                    variable: measurement.parameter,
                    [measurement.parameter]: measurement.value,
                    unit: measurement.unit,
                    lastUpdated: measurement.lastUpdated,
                    sourceName: measurement.sourceName,
                    averagingPeriod: measurement.averagingPeriod
                  }
                }
                measurementCollection.push(measurementFeature)
              //}
              })
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
        createStores: [{ id: 'memory'}],
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
