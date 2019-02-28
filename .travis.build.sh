#!/bin/bash
source .travis.env.sh

echo Building k-openaq $VERSION with Krawler $KRAWLER_BRANCH

# Build Stations image
docker build --build-arg KRAWLER_BRANCH=$KRAWLER_BRANCH -f dockerfile -t kalisio/k-openaq .
docker tag kalisio/k-openaq kalisio/k-openaq:$VERSION

# Push the built images to Docker hub
docker login -u="$DOCKER_USER" -p="$DOCKER_PASSWORD"
docker push kalisio/k-openaq:$VERSION
