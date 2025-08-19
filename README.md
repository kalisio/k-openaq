# k-openaq

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k-openaq?sort=semver&label=latest)](https://github.com/kalisio/k-openaq/releases)
[![CI](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml/badge.svg)](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Krawler](https://kalisio.github.io/krawler/) based service to download data from [OpenAQ](https://openaq.org)

## Description

The **k-openaq** allows to download **OpenAQ** data for a given list of countries.

The available parameters are:
* `pm25`: particulate matter PM255
* `pm10`: Particulate matter PM10
* `so2`: Sulphur dioxide  
* `no2`: Nitrogen dioxide 
* `o3`: Ozone
* `co`: Carbon monoxide 
* `bc`: Black carbon

The job relies on the [OpenAQ API v3.0](https://docs.openaq.org/api).

> [!NOTE] 
> See the [Countries](https://docs.openaq.org/resources/countries) documentation to learn how to obtain the list of countries.

> [!WARNING]
> Since the API version 3, it is required to get an [API Key](https://docs.openaq.org/using-the-api/quick-start).

## Configuration

### locations

| Parameter | Description |
|---|---|
| `API_KEY` | the API Key. |
| `COUNTRIES` | a list specifying the countries to be taken into account. By default:  `22,129` |
| `LOOKBACK_PERIOD` |The period, starting from now, that determines when a location becomes invalid. By default `P3M`. |
| `DB_URL` | the database url. By default: `mongodb://localhost:27017/openaq` |

### measurements

| Parameter | Description |
|---|---|
| `API_KEY` | the API Key. |
| `LOOKBACK_PERIOD` | The period, starting from now, that determines when a measurement has to be ignored. By default `PT3H`. |
| `DELAY`| The delay in milliseconds to wait before executing the next request to the API. Default is `1200`. |
| `TTL` | The retention period in seconds of the data. By default: `7 * 24 * 60 * 60` (7 days) |
| `TIMEOUT` | the job timeout in milliseconds. By default: `3600000` (1 hour)|
| `DB_URL` | the database url. By default: `mongodb://localhost:27017/openaq` |
| `DEBUG` | Enables debug output. Set it to `krawler*` to enable full output. By default it is undefined. |

## Deployment

We personally use [Kargo](https://kalisio.github.io/kargo/) to deploy the service.

## Contributing

Please refer to [contribution section](./CONTRIBUTING.md) for more details.

## Authors

This project is sponsored by 

![Kalisio](https://s3.eu-central-1.amazonaws.com/kalisioscope/kalisio/kalisio-logo-black-256x84.png)

## License

This project is licensed under the MIT License - see the [license file](./LICENSE) for details
