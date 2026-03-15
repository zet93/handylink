#!/bin/bash
INPUT=$(cat)

# Block EF Core migrations
if echo "$INPUT" | grep -qE "dotnet ef (migrations add|database update)"; then
  echo '{
    "decision": "block",
    "message": "EF Core migrations are disabled on HandyLink. Write a SQL script in Data/Migrations/ and run it in the Supabase SQL editor. See .claude/skills/write-migration/SKILL.md."
  }'
  exit 0
fi

# Block committing secrets
if echo "$INPUT" | grep -qE "git add.*(appsettings|\.env)"; then
  echo '{
    "decision": "block",
    "message": "Do not git add appsettings.json or .env files — they may contain real secrets."
  }'
  exit 0
fi

echo '{"decision": "allow"}'
