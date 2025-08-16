import _ from 'lodash'
import winston from 'winston'
import { hooks } from '@kalisio/krawler'

const API_KEY = process.env.API_KEY
const COUNTRIES = process.env.COUNTRIES && process.env.COUNTRIES.split(',') || ['22', '129'] // see https://api.openaq.org/v3/countries
const TIMEOUT = parseInt(process.env.TIMEOUT, 10) || (60 * 60 * 1000) // duration in milliseconds
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const LOCATIONS_COLLECTION = 'openaq-locations'
const BASE_URL = 'https://api.openaq.org/v3/locations?limit=1000'


// Create a custom hook to generate tasks
let generateTasks = (options) => {
  return (hook) => {
    let tasks = []
    _.forEach(COUNTRIES, country => {
      console.log('[i] Creating task for country', country)
      tasks.push({
        taskId: country,
        options: {
          url: `${BASE_URL}&countries_id=${country}`,
          headers: {
            'X-API-Key': API_KEY
          }
        }
      })
    })
    hook.data.tasks = tasks
    return hook
  }
}
hooks.registerHook('generateTasks', generateTasks)

export default {
  id: 'openaq-locations',
  store: 'memory',
  options: {
    workersLimit: 1,
    faultTolerant: false,
    timeout: TIMEOUT
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
        log: (logger, item) => logger.info(`[${item.taskId}] ${_.get(item.openaqResponse, 'meta.found')} locations found.`),
        convertToGeoJson: {
          dataPath: 'data.openaqResponse.results',
          longitude: 'coordinates.longitude',
          latitude: 'coordinates.latitude'
        },
        updateMongoCollection: {
          dataPath: 'data.openaqResponse.results',
          collection: LOCATIONS_COLLECTION,
          filter: { 'properties.id': '<%= properties.id %>' },
          upsert : true,
          chunkSize: 256
        },
        clearData: {}
      }
    },
    jobs: {
      before: {
        printEnv: {
          COUNTRIES: COUNTRIES,
          TIMEOUT: TIMEOUT
        },
        createStores: { 
          id: 'memory'
        },
        createLogger: {
          loggerPath: 'taskTemplate.logger',
          Console: {
            format: winston.format.printf(log => winston.format.colorize().colorize(log.level, `${log.level}: ${log.message}`)),
            level: 'verbose'
          }
        },
        connectMongo: {
          url: DB_URL,
          // Required so that client is forwarded from job to tasks
          clientPath: 'taskTemplate.client'
        },
        createMongoCollection: {
          clientPath: 'taskTemplate.client',
          collection: LOCATIONS_COLLECTION,
          indices: [
            [{ 'properties.id': 1 }, { unique: true }],
            { geometry: '2dsphere' }
          ]
        },
        generateTasks: {}
      },
      after: {
        disconnectMongo: {
          clientPath: 'taskTemplate.client'
        },
        removeLogger: {
          loggerPath: 'taskTemplate.logger'
        },
        removeStores: ['memory']
      },
      error: {
        disconnectMongo: {
          clientPath: 'taskTemplate.client'
        },
        removeLogger: {
          loggerPath: 'taskTemplate.logger'
        },
        removeStores: ['memory']
      }
    }
  }
}
