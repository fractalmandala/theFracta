#!/bin/zsh
DB="file:$HOME/.agentsview/sessions.db?mode=ro"
echo "===== 02686ff89 ords 21-22 (grilling frame) ====="
sqlite3 -readonly "$DB" "SELECT ordinal, role, content_length, substr(replace(content, char(10), ' ⏎ '), 1, 450) FROM messages WHERE session_id='opencode:ses_02686ff89ffer8tCnNublPLCdp' AND ordinal BETWEEN 21 AND 22;"
echo "===== 02686ff89 ord 30-31 (post-go scaffold plan) ====="
sqlite3 -readonly "$DB" "SELECT ordinal, role, content_length, substr(replace(content, char(10), ' ⏎ '), 1, 400) FROM messages WHERE session_id='opencode:ses_02686ff89ffer8tCnNublPLCdp' AND ordinal BETWEEN 30 AND 31;"
echo "===== 02686ff89 ord 132 (reactivity answer) ====="
sqlite3 -readonly "$DB" "SELECT role, content_length, substr(replace(content, char(10), ' ⏎ '), 1, 500) FROM messages WHERE session_id='opencode:ses_02686ff89ffer8tCnNublPLCdp' AND ordinal=132;"
echo "===== 02660135e ords 1-3 (skills fix) ====="
sqlite3 -readonly "$DB" "SELECT ordinal, role, content_length, substr(replace(content, char(10), ' ⏎ '), 1, 400) FROM messages WHERE session_id='opencode:ses_02660135effeii42xz3lE6CrNS' AND ordinal BETWEEN 1 AND 3;"
echo "===== 02660135e ord 31 (dialyma deletion) ====="
sqlite3 -readonly "$DB" "SELECT ordinal, role, content_length, substr(replace(content, char(10), ' ⏎ '), 1, 400) FROM messages WHERE session_id='opencode:ses_02660135effeii42xz3lE6CrNS' AND ordinal=31;"
echo "===== 02602dadb ord6 report tail ====="
sqlite3 -readonly "$DB" "SELECT substr(replace(content, char(10), ' ⏎ '), length(content)-650) FROM messages WHERE session_id='opencode:ses_02602dadbffe07koavM0fJTVNU' AND ordinal=6;"
echo "===== overlaps ====="
grep -ril "grilling" wiki/entries/ | head -5
grep -ril "dialyma" wiki/entries/ | head -5
