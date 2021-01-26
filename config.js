module.exports = {
  countries: [ 'FR', 'AD', 'BE', 'LU', 'CH' ],
  variables: [ 'pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc'],
  expirationPeriod: 7 * 24 * 60 * 60, // in seconds
  queryLimit: 1000,
}