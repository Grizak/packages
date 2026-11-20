#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"
cd site

: "${GPG_KEY_ID:?GPG_KEY_ID must be set}"

export LC_ALL=C

gpg --armor --export "$GPG_KEY_ID" > key.asc
gpg --with-colons --show-keys key.asc |
  awk -F: '/^fpr:/ {print $10; exit}' > fingerprint.txt

sign() {
  gpg --batch --yes --pinentry-mode loopback \
      --passphrase "$GPG_PASSPHRASE" \
      --default-key "$GPG_KEY_ID" "$@"
}

# ---------- apt ----------
rm -rf apt/pool
mkdir -p apt/pool

shopt -s nullglob
debs=("$ROOT"/incoming/*.deb)
shopt -u nullglob

if ((${#debs[@]} > 0)); then
  cp "${debs[@]}" apt/pool/
fi

(
  cd apt
  for arch in amd64 arm64; do
    d="dists/stable/main/binary-$arch"
    mkdir -p "$d"
    dpkg-scanpackages --multiversion --arch "$arch" pool > "$d/Packages"
    gzip -9kf "$d/Packages"
  done

  apt-ftparchive \
    -o APT::FTPArchive::Release::Origin=Grizak \
    -o APT::FTPArchive::Release::Suite=stable \
    -o APT::FTPArchive::Release::Codename=stable \
    -o APT::FTPArchive::Release::Architectures="amd64 arm64" \
    -o APT::FTPArchive::Release::Components=main \
    release dists/stable > dists/stable/Release

  sign --clearsign -o dists/stable/InRelease dists/stable/Release
  sign --detach-sign --armor -o dists/stable/Release.gpg dists/stable/Release
)

# ---------- rpm ----------
rm -rf rpm
mkdir -p rpm

shopt -s nullglob
rpms=("$ROOT"/incoming/*.rpm)
shopt -u nullglob

if ((${#rpms[@]} > 0)); then
  cp "${rpms[@]}" rpm/
fi

PASSFILE="$(mktemp)"
chmod 600 "$PASSFILE"
printf '%s' "$GPG_PASSPHRASE" > "$PASSFILE"
trap 'rm -f "$PASSFILE"' EXIT

RPM_MACROS=(
  --define "_gpg_name $GPG_KEY_ID"
  --define "_gpg_sign_cmd_extra_args --pinentry-mode loopback --passphrase-file $PASSFILE"
)

RPM_DB="$(mktemp -d)"
trap 'rm -rf "$PASSFILE" "$RPM_DB"' EXIT

rpm --dbpath "$RPM_DB" --import key.asc

shopt -s nullglob
for f in rpm/*.rpm; do
  # Remove existing OpenPGP signatures if present; don't hide other failures.
  if rpm -Kv "$f" 2>&1 | grep -qiE 'pgp|gpg'; then
    rpm --delsign "$f"
  fi

  rpm "${RPM_MACROS[@]}" --addsign "$f"

  # rpmkeys -K returns nonzero when verification fails.
  if ! rpmkeys --dbpath "$RPM_DB" -K "$f"; then
    echo "Signature check failed for $f" >&2
    rpmkeys --dbpath "$RPM_DB" -K -v "$f" >&2 || true
    exit 1
  fi
done
shopt -u nullglob

createrepo_c rpm

# ---------- pacman ----------
rm -rf arch
mkdir -p arch

shopt -s nullglob
arch_pkgs=("$ROOT"/incoming/*.pkg.tar.zst)
shopt -u nullglob

for pkg in "${arch_pkgs[@]}"; do
  parch="$(tar -xOf "$pkg" .PKGINFO |
    awk -F' = ' '/^arch = /{print $2; exit}')"

  case "$parch" in
    x86_64|aarch64)
      mkdir -p "arch/$parch"
      cp "$pkg" "arch/$parch/"
      ;;
    any)
      for a in x86_64 aarch64; do
        mkdir -p "arch/$a"
        cp "$pkg" "arch/$a/"
      done
      ;;
    *)
      echo "Unexpected arch '$parch' in $pkg" >&2
      exit 1
      ;;
  esac
done

shopt -s nullglob
for dir in arch/*/; do
  pkgs=("$dir"*.pkg.tar.zst)
  ((${#pkgs[@]} > 0)) || continue

  # Always generate package signatures for this run, avoiding stale .sig files.
  for f in "${pkgs[@]}"; do
    sign --detach-sign --no-armor -o "$f.sig" "$f"
  done

  docker run --rm \
    -v "$PWD/$dir:/r" \
    archlinux:latest \
    bash -c 'cd /r && rm -f grizak.db* grizak.files* && repo-add grizak.db.tar.zst *.pkg.tar.zst'

  # Ensure output files are writable by the current user.
  if [[ "$(stat -c %u "$dir/grizak.db.tar.zst")" != "$(id -u)" ]]; then
    sudo chown -R "$(id -u):$(id -g)" "$dir"
  fi

  cp -f "$dir/grizak.db.tar.zst" "$dir/grizak.db"
  cp -f "$dir/grizak.files.tar.zst" "$dir/grizak.files"

  # repo-add signs the database artifact; sign the published filename too.
  sign --detach-sign --no-armor -o "$dir/grizak.db.sig" "$dir/grizak.db"
done
shopt -u nullglob

# ---------- Human-readable website meta ----------
python3 "$ROOT/tools/scripts/generate_package_meta.py" "$ROOT"
