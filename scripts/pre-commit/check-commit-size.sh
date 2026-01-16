#!/bin/bash
# Check if commit size exceeds a threshold (number of files)

THRESHOLD=50
FILE_COUNT=$(git diff --cached --name-only | wc -l)

if [ "$FILE_COUNT" -gt "$THRESHOLD" ]; then
    echo "Error: Commit size exceeds threshold ($FILE_COUNT > $THRESHOLD files)."
    echo "Please split your commit into smaller chunks."
    exit 1
fi

echo "Commit size check passed ($FILE_COUNT files)."
exit 0
