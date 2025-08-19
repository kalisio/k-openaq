ARG KRAWLER_TAG

# 
# Make a Krawler image alias to be able to take into account the KRAWLER_TAG argument
#
FROM kalisio/krawler:${KRAWLER_TAG} AS krawler
LABEL maintainer="Kalisio <contact@kalisio.xyz>"

# Default environment variables
ENV CRON="0 0 0 * * *"

# Copy the job and install the dependencies
COPY --chown=node:node jobfile.locations.js package.json yarn.lock /opt/job/
WORKDIR /opt/job
RUN yarn && yarn link @kalisio/krawler && yarn cache clean

# Run the job
CMD krawler --cron "$CRON" --run jobfile.locations.js
