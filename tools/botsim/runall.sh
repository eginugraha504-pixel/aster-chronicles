#!/bin/bash
# runall.sh HARI -> /tmp/s4/<profil>_<pengalaman>_<seed>.json (6 paralel), lalu: python3 mkcurves.py /tmp/s4
# Butuh dist/index.html terbaru (python3 tools/build.py) dan playwright + chromium.
D=$1;DIR=$(cd "$(dirname "$0")";pwd);mkdir -p /tmp/s4
jobs=()
for pf in santai reguler rajin hardcore; do for sk in baru biasa veteran; do for sd in 1 2; do jobs+=("$pf $sk $sd"); done; done; done
printf '%s\n' "${jobs[@]}" | xargs -P 6 -L 1 bash -c 'timeout 3000 python3 '"$DIR"'/runsim2.py $0 $1 '$D' $2 /tmp/s4/$0_$1_$2.json'
