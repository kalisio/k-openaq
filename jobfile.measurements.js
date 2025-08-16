import _ from 'lodash'
import winston from 'winston'
import moment from 'moment'
import { hooks } from '@kalisio/krawler'

const API_KEY = process.env.API_KEY
const PARAMETERS = process.env.PARAMETERS && process.env.PARAMETERS.split(',') || ['1', '2', '3', '4', '5', '6']
const LOOKBACK_PERIOD = process.env.LOOKBACK_PERIOD || 'PT15M'
const TTL = +process.env.TTL || (7 * 24 * 60 * 60)  // duration in seconds
const TIMEOUT = parseInt(process.env.TIMEOUT, 10) || (60 * 60 * 1000) // duration in milliseconds
const DB_URL = process.env.DB_URL || 'mongodb://127.0.0.1:27017/openaq'
const MEASUREMENTS_COLLECTION = 'openaq-measurements'
const LOCATIONS_COLLECTION = 'openaq-locations'
const BASE_URL = 'https://api.openaq.org/v3/parameters'

// Create a custom hook to generate tasks
let generateTasks = (options) => {
  return (hook) => {
    let tasks = []
    const minDateTime = moment.utc().subtract(LOOKBACK_PERIOD).toISOString()
    _.forEach(PARAMETERS, parameter => {
      console.log('[i] Creating task for parameter', parameter)
      tasks.push({
        taskId: parameter,
        options: {
          url: `${BASE_URL}/${parameter}/latest?datetime_min=${minDateTime}&limit=1000`,
          headers: {
            'X-API-Key': API_KEY
          }
        }
      })
    })
    hook.data.tasks = tasks
  }
}
hooks.registerHook('generateTasks', generateTasks)

export default {
  id: 'openaq-measurements',
  store: 'memory',
  options: {
    workersLimit: 1,
    faultTolerant: true,
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
        apply: {
          function: (item) => {
            console.log(item.openaqResponse.meta)
          }
        },
        clearData: {}
      }
    },
    jobs: {
      before: {
        printEnv: {
          PARAMETERS: PARAMETERS,
          LOOKBACK_PERIOD: LOOKBACK_PERIOD,
          TTL: TTL,
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
          collection: MEASUREMENTS_COLLECTION,
          indices: [
            [{ time: 1, 'properties.id': 1 }, { unique: true }],          
            [{ time: 1 }, { expireAfterSeconds: TTL }], // days in s  
            { geometry: '2dsphere' }
          ]
        },
        readMongoCollection: {
          clientPath: 'taskTemplate.client',
          collection: LOCATIONS_COLLECTION,
          dataPath: 'data.taskTemplate.locations'
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
