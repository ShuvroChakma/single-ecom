#!/bin/bash
# Run frontend tests with coverage check

echo "Running frontend tests..."
docker-compose exec -T frontend npm run test:coverage

if [ $? -ne 0 ]; then
    echo "Error: Frontend tests failed or coverage is below 80%."
    exit 1
fi

echo "Frontend tests passed with sufficient coverage."
exit 0
