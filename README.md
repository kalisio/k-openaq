# k-openaq

[![Latest Release](https://img.shields.io/github/v/tag/kalisio/k-openaq?sort=semver&label=latest)](https://github.com/kalisio/k-openaq/releases)
[![CI](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml/badge.svg)](https://github.com/kalisio/k-openaq/actions/workflows/main.yaml)
[![Code Climate](https://codeclimate.com/github/kalisio/k-openaq/badges/gpa.svg)](https://codeclimate.com/github/kalisio/k-openaq)
[![Test Coverage](https://codeclimate.com/github/kalisio/k-openaq/badges/coverage.svg)](https://codeclimate.com/github/kalisio/k-openaq/coverage)
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

The job relies on the [OpenAQ API v2.0](https://docs.openaq.org/reference/introduction-1).

> [!NOTE]
> Because of [Rate limiting](https://docs.openaq.org/docs/usage-limits#rate-limiting) It is recomended to register to OpenAQ to get an [API Key](https://docs.openaq.org/docs/getting-started#api-key).

The following diagram illustrates how the job works:

![diagram](./jobfile.png)

## Configuration

The job can be configured by setting the following environment variables:

| Parameter | Description |
|---|---|
| `API_KEY` | the API Key. |
| `COUNTRIES_IDS` | an array to specify the countries to take into account. By default:  `'2', '134','133','132'` |
| `VARIABLES` | an array to specify the variables to scrape. By default: `'pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc'` |
| `QUERY_LIMIT` | the limit of returned results. By default: `1000` |
| `TTL` | the time to live of the data. By default: `7 day` |
| `TIMEOUT` | the timeout of the request. By default: `60 * 60 * 1000` |
| `DB_URL` | the database url. By default: `mongodb://localhost:27017/openaq` |

## Deployment

We personally use [Kargo](https://kalisio.github.io/kargo/) to deploy the service.

## Contributing

Please refer to [contribution section](./CONTRIBUTING.md) for more details.

## Authors

This project is sponsored by 

![Kalisio](https://s3.eu-central-1.amazonaws.com/kalisioscope/kalisio/kalisio-logo-black-256x84.png)

## License

This project is licensed under the MIT License - see the [license file](./LICENSE) for details
