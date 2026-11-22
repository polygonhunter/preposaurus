# Aufbewahrung (UMSETZUNG M13-03): behält in einem Ordner die neuesten Stände und löscht ältere.
# Stände sind Unterordner, deren Name mit einer Jahreszahl beginnt (2026-11-22, 2026-W47).
# Die Namen sortieren sich wie die Zeit. Alles andere (z. B. ein laufender Stand .laufend-…)
# bleibt unberührt.
#   prune_old <ordner> <anzahl>

prune_old() {
  prune_dir=$1
  prune_keep=$2
  [ -d "$prune_dir" ] || return 0
  ls -1 "$prune_dir" | grep -E '^[0-9]{4}-' | sort -r | tail -n +"$((prune_keep + 1))" |
    while IFS= read -r prune_name; do
      rm -rf "${prune_dir:?}/$prune_name"
    done
}
