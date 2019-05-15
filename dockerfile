FROM node:8

LABEL maintainer "<contact@kalisio.xyz>"

ARG KRAWLER_BRANCH
ENV KRAWLER_BRANCH=$KRAWLER_BRANCH

# Install Krawler
RUN \
  git clone https://github.com/kalisio/krawler.git -b $KRAWLER_BRANCH --single-branch && \
  cd krawler && \
  yarn install && \
  yarn link && \
  cd .. && \
  yarn link @kalisio/krawler
ENV NODE_PATH=/krawler/node_modules

# Install OpenAQ
COPY config.js .
COPY jobfile.js .

HEALTHCHECK --interval=1m --timeout=10s --start-period=1m CMD node ./krawler/healthcheck.js

# Run the job
CMD node ./krawler --cron "0 10 * * * *" jobfile.js

