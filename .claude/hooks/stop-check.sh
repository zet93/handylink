#!/bin/bash
INPUT=$(cat)
RESPONSE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    print(json.load(sys.stdin).get('response', ''))
except:
    print('')
")

if echo "$RESPONSE" | grep -qi "Handler\.cs"; then
  if ! echo "$RESPONSE" | grep -qi "HandlerTests\|test"; then
    echo '{"continue": true, "feedback": "Handler was created — did you also create HandlerTests.cs in HandyLink.Tests/Unit/Features/?"}'
    exit 0
  fi
fi
exit 0
