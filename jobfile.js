const moment = require('moment')
const krawler = require('@kalisio/krawler')
const hooks = krawler.hooks

const config = require('./config')

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const baseUrl = 'https://api.openaq.org/v1/latest?'

// Helper function tp create the indexes for each variables
function generateIndexes () {
	let indexes  = []
	config.variables.forEach( variable => {
		let key = `properties.${variable}`
		let index = [ { [key] : 1 }, { background: true } ]
		indexes.push(index)
	})
	return indexes
}

// Create a custom hook to generate tasks
let generateTasks = (options) => {
  return (hook) => {
    let tasks = []
    config.countries.forEach(country => {
      config.variables.forEach(variable => {
        let task = {
        id: country + '_' + variable,
        variable,
        options: {
          url: baseUrl + 'country=' + country + '&parameter=' + variable + '&limit=' + config.limit
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

module.exports = {
  id: 'openaq',
  store: 'memory',
  options: {
    workersLimit: 1,
    faultTolerant: false
  },
  taskTemplate: {
    id: 'openaq/<%= taskId %>',
    type: 'http'
  },
  hooks: {
    tasks: {
      after: {
        readJson: {
		},
		apply: {
      function: (item) => {
			  let startRollingTime = Date.now() - config.expiringPeriod * 1000
			  let measurements = []
        let stations = item.data.results
			  stations.forEach(station => {
			    station.measurements.forEach( measurement => {
				    let time = new Date(measurement.lastUpdated).getTime()
				    if (time > startRollingTime) {
					    let measurement_feature = { 		  
						    type: 'Feature',
						    time: measurement.lastUpdated,
						    geometry: {
						      type: 'Point',
						      coordinates: [ station.coordinates.longitude, station.coordinates.latitude ]
						    },
						    properties: {
						      country: station.country,
						      location: station.location,
						      variable: measurement.parameter,
						      [measurement.parameter]: measurement.value,
						      unit: measurement.unit,
						      sourceName: measurement.sourceName,
						      averagingPeriod: measurement.averagingPeriod
						    }
					    }
					    measurements.push(measurement_feature)
				    }
			    })
        })
        item.data = measurements
		  }
    },
		/*writeJson: {
			store: 'fs'
		},*/
        writeMongoCollection: {
		  faultTolerant: true,
          chunkSize: 256,
          collection: 'openaq',
          transform: { unitMapping: { time: { asDate: 'utc' } } }
        },
        clearData: {}
      }
    },
    jobs: {
      before: {
        createStores: [{
          id: 'memory'
        }, {
          id: 'fs',
          options: {
            path: __dirname
          }
        }],
        connectMongo: {
          url: dbUrl,
          // Required so that client is forwarded from job to tasks
          clientPath: 'taskTemplate.client'
        },
        createMongoCollection: {
          clientPath: 'taskTemplate.client',
          collection: 'openaq',
          indices: generateIndexes().concat([
            [{ time: 1, 'properties.country': 1, 'properties.location': 1, 'properties.variable': 1 }, { unique: true }],
            [{ 'properties.location': 1, time: 1 }, { background: true }],
            [{ time: 1 }, { expireAfterSeconds: config.expiringPeriod }], // days in s
            { geometry: '2dsphere' }                                                                                                              
          ]),
        },
        generateTasks: {
		}
      },
      after: {
        disconnectMongo: {
          clientPath: 'taskTemplate.client'
        },
        removeStores: ['memory', 'fs']
      }
    }
  }
}
