#!/bin/sh
# Hamur Kahraman oyunları: yerel sunucuyu başlatır ve oyunu tarayıcıda açar. Kapatmak için bu pencereyi kapat.
D="$(cd "$(dirname "$0")" 2>/dev/null && pwd)"
PORT=5095
( sleep 1; open "http://localhost:$PORT/index.html" ) &
exec /usr/bin/python3 "$D/sunucu.py" "$PORT"
