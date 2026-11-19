#!/bin/bash
# runwhale.sh HARI -> /tmp/s5/<profil>_<pengalaman>_<tier>_<seed>.json : pembelanja besar yang membakar permata
# (isi ulang stamina & reset dungeon sampai batas). Lalu: python3 mkcurves.py /tmp/s4 /tmp/s5
D=$1;DIR=$(cd "$(dirname "$0")";pwd);mkdir -p /tmp/s5
jobs=()
for pf in santai reguler rajin hardcore; do for sk in baru biasa veteran; do jobs+=("$pf $sk 1 whale"); done; done
for pf in rajin hardcore; do for sk in biasa veteran; do for sd in 1 2; do jobs+=("$pf $sk $sd swhale"); done; done; done
for sd in 1 2; do jobs+=("hardcore veteran $sd mwhale"); done
printf '%s\n' "${jobs[@]}" | xargs -P 6 -L 1 bash -c 'timeout 3000 python3 '"$DIR"'/runsim2.py $0 $1 '$D' $2 /tmp/s5/$0_$1_$3_$2.json $3'
