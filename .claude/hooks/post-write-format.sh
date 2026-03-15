#!/bin/bash
INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('path', ''))
except:
    print('')
")

if [[ "$FILE" == *.cs ]]; then
  dotnet format --include "$FILE" --verbosity quiet 2>&1
  echo '{"feedback": "C# file auto-formatted."}'
fi
