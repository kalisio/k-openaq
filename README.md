# k-openaq

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k-openaq?sort=semver&label=latest)](https://github.com/kalisio/k-openaq/releases)
[![CI](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml/badge.svg)](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A [Krawler](https://kalisio.github.io/krawler/) based service to download data from [OpenAQ](https://openaq.org)

## Description

The **k-openaq** allows to download **OpenAQ** data for a given list of countries.
The available countries is available [here](https://docs.openaq.org/reference/countries_get_v2_countries_get). Also, a full **Json** output can be retrieved using the the following [query](https://api.openaq.org/v2/countries)

The available variables are:
* `pm25`: particulate matter PM255
* `pm10`: Particulate matter PM10
* `so2`: Sulphur dioxide  
* `no2`: Nitrogen dioxide 
* `o3`: Ozone
* `co`: Carbon monoxide 
* `bc`: Black carbon

The job relies on the [OpenAQ API v3.0](https://docs.openaq.org/api).

> [!NOTE]
> Since the API version 3, it is required to get an [API Key](https://docs.openaq.org/using-the-api/quick-start).

## Configuration

### locations

| Parameter | Description |
|---|---|
| `API_KEY` | the API Key. |
| `COUNTRIES` | a list specifying the countries to be taken into account. By default:  `22,129` |
| `LOOKBACK_PERIOD` | The lookback period that specifies when a location becomes invalid. By default `P3M`. |
| `TIMEOUT` | the timeout of the request in milliseconds. By default: `60 * 60 * 1000` |
| `DB_URL` | the database url. By default: `mongodb://localhost:27017/openaq` |

### measurements

| Parameter | Description |
|---|---|
| `API_KEY` | the API Key. |
| `LOOKBACK_PERIOD` | The lookback period that specifies when a measurement becomes invalid. By default `PT3H`. | |
| `TTL` | The retention period in seconds of the data. By default: `7 * 24 * 60 * 60` (~7 days) |
| `TIMEOUT` | the timeout of the request in milliseconds. By default: `60 * 60 * 1000` |
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
