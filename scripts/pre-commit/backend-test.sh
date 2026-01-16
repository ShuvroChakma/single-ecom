#!/bin/bash
# Run backend tests with coverage check

echo "Running backend tests..."
docker-compose exec -T backend pytest --cov=. --cov-report=term-missing --cov-fail-under=80

if [ $? -ne 0 ]; then
    echo "Error: Backend tests failed or coverage is below 80%."
    exit 1
fi

echo "Backend tests passed with sufficient coverage."
exit 0
