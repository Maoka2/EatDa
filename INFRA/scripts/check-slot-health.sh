ENV=$1
NEXT_SLOT=$2 

ENCODED_QUERY="up%7Bjob%3D%22eatda-${ENV}-${NEXT_SLOT}%22%7D"
PROMETHEUS_URL=${PROMETHEUS_URL:-http://prometheus:9090}

MAX_RETRIES=10
SLEEP_TIME=5

COUNT=1
echo "Checking health for ${ENV}-${NEXT_SLOT}"
while [ $COUNT -le $MAX_RETRIES ]; do
  echo "Attempt $COUNT: health check for ${ENV}-${NEXT_SLOT}"
  VALUE=$(docker exec curlbox curl -s "${PROMETHEUS_URL}/api/v1/query?query=${ENCODED_QUERY}" | grep '"value"' | grep -o '"[01]"' | tr -d '"')

  if [ "$VALUE" == "1" ]; then
    echo "Health check passed for ${ENV}-${NEXT_SLOT}"
    exit 0
  fi

  sleep $SLEEP_TIME
  COUNT=$((COUNT + 1))
done

echo "Health check failed for ${ENV}-${NEXT_SLOT}"
exit 1
