ENV=$1

if docker ps | grep -q "eatda-$ENV-green"; then
  echo "blue"
else
  echo "green"
fi
