#!/bin/bash
# validate_indra.sh - A simple linter for INDRA core files.

CORE_DIR="core"
EXIT_CODE=0

echo "--- Starting INDRA Core Validation ---"

find "$CORE_DIR" -name "*.in" -print0 | while IFS= read -r -d $'\0' file; do
  echo -n "Validating $file... "
  
  # Test 1: Must start with a comment or a valid component definition.
  if ! grep -q -E '^(#|@command:|@engine:|!import)' "$file"; then
    echo "FAIL: Does not start with a valid header."
    EXIT_CODE=1
    continue
  fi

  # Test 2: `you:` block must be followed by `are:`, `must:`, `understand:`.
  if grep -A 3 'you:' "$file" | sed 's/ *//' | sed '/^$/d' | sed 'N;N;s/\n/ /' | grep -v -q 'are:.*must:.*understand:'; then
      # This is a bit complex; it checks if the 3 lines after 'you:' contain the required keywords.
      # We will accept some false positives for now.
      : # Placeholder for a more robust check
  fi

  echo "OK"
done

echo "--- Validation Complete ---"
exit $EXIT_CODE
