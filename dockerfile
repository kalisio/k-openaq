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

# Install c3x-Radar
COPY config.js .
COPY jobfile.js .

# Run the job
ENV NODE_PATH=/krawler/node_modules
CMD node ./krawler --cron "0,5,10,15,20,25,30,35,40,45,50,55 * * * *" jobfile.js

