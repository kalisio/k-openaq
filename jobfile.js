const moment = require('moment')
const krawler = require('@kalisio/krawler')
const hooks = krawler.hooks

const config = require('./config')

const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const baseUrl = 'https://api.openaq.org/v1/measurements?'

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
          url: baseUrl + 'country=' + country +
              '&date_from=' + moment().subtract(config.frequency, 'seconds').toISOString() +
              '&parameter=' + variable +
              '&limit=' + config.limit
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
        readJson: {},
        convertToGeoJson: {
          dataPath: 'result.data.results',
          longitude: 'coordinates.longitude',
          latitude: 'coordinates.latitude'
        },
		    apply: {
          function: (item) => {
            let features = item.data.results.features
			      features.forEach(feature => {
				      feature['time'] = feature.properties.date.utc
				      feature.properties[feature.properties.parameter] = feature.properties.value
				      delete feature.properties.parameter
				      delete feature.properties.value
				      delete feature.properties.date
				      delete feature.properties.coordinates
            })
            item.data = features
		      }
        },
		    /*writeJson: {
		      store: 'fs'
		    },*/
        writeMongoCollection: {
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
          indices: [ 
            [{ time: 1 }, { expireAfterSeconds: (7 * 24 * 60 * 60) }], // days in s
            { 'location': 1 }, 
            { geometry: '2dsphere' }
          ],
        },
        generateTasks: {}
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
