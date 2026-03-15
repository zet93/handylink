Read GitHub issue #$ARGUMENTS using the GitHub MCP server.

Then:
1. Summarise the issue in 2 sentences
2. Identify which files need to change
3. Implement the fix following HandyLink VSA + CQRS pattern
4. Run: dotnet build backend/ && dotnet test backend/
5. If tests pass: create a PR titled with the issue title,
   body explaining what changed and why, linked to issue #$ARGUMENTS
6. If tests fail: fix them first
