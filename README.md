# k-openaq

A [Krawler](https://kalisio.github.io/krawler/) based service to download data from [Open AQ](https://openaq.org)

## Concepts

The **k-openaq** allows to download **Open AQ** data for a given list of countries.
The available countries is available [here](https://openaq.org/#/countries?_k=804jo5). It can also be listed using an the following [http request](https://api.openaq.org/v1/countries)

The available variables are:
* `pm25`: particulate matter PM255
* `pm10`: Particulate matter PM10
* `so2`: Sulphur dioxide  
* `no2`: Nitrogen dioxide 
* `o3`: Ozone
* `co`: Carbon monoxide 
* `bc`: Black carbon

The job relies on the [OpenAQ API](https://docs.openaq.org/#api-_).

The following diagram illustrates how the job works:

![diagram](./jobfile.png)

## Configuration

The job can be configured using the `config.json` file. It exposes the following parameters:

| Parameter | Description |
|---|---|
| `countries` | an array to specify the countries to take into account. By default: [ `FR` ] |
| `variables` | an array to specify the variables to scrape. By default: `[ 'pm25', 'pm10', 'so2', 'no2', 'o3', 'co', 'bc' ]` |
| `frequency` | allows to specify the `date_from` parameter. The date is equal to now() minus the frequency in seconds. By default: `3600` |
| `limit` | the limit of returned results. By default: `1000` |

## Exploitation

_TODO_

## Authors

This project is sponsored by 

![Kalisio](https://s3.eu-central-1.amazonaws.com/kalisioscope/kalisio/kalisio-logo-black-256x84.png)

## License

This project is licensed under the MIT License - see the [license file](./LICENCE) for details

