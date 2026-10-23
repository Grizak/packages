#!/usr/bin/env bash
set -euo pipefail
ROOT="$PWD"
cd site
touch .nojekyll
gpg --armor --export "$GPG_KEY_ID" > key.asc
gpg --with-colons --show-keys key.asc | awk -F: '/^fpr:/ {print $10; exit}' > fingerprint.txt
sign() {
  gpg --batch --yes --pinentry-mode loopback \
      --passphrase "$GPG_PASSPHRASE" \
      --default-key "$GPG_KEY_ID" "$@"
}

# ---------- apt ----------
mkdir -p apt/pool
cp "$ROOT"/incoming/*.deb apt/pool/ 2>/dev/null || true
(
  cd apt
  for arch in amd64 arm64; do
    d=dists/stable/main/binary-$arch
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
  sign -abs        -o dists/stable/Release.gpg dists/stable/Release
)

# ---------- rpm ----------
mkdir -p rpm
cp "$ROOT"/incoming/*.rpm rpm/ 2>/dev/null || true

PASSFILE="$(mktemp)"
chmod 600 "$PASSFILE"
printf '%s' "$GPG_PASSPHRASE" > "$PASSFILE"
trap 'rm -f "$PASSFILE"' EXIT

RPM_MACROS=(
  --define "_gpg_name $GPG_KEY_ID"
  --define "_gpg_sign_cmd_extra_args --pinentry-mode loopback --passphrase-file $PASSFILE"
)

# Import the public key into rpm's keyring so verification can succeed
rpm --import key.asc

shopt -s nullglob
for f in rpm/*.rpm; do
  rpm --delsign "$f" >/dev/null 2>&1 || true   # drop any stale signatures
  rpm "${RPM_MACROS[@]}" --addsign "$f"
  if ! rpm -K "$f" | grep -q 'digests signatures OK'; then
    echo "Signature check failed for $f" >&2
    rpm -K -vv "$f" >&2 || true
    exit 1
  fi
done
shopt -u nullglob

rm -rf rpm/repodata
createrepo_c rpm
sign --detach-sign --armor rpm/repodata/repomd.xml

# ---------- pacman ----------
for pkg in "$ROOT"/incoming/*.pkg.tar.zst; do
  [ -f "$pkg" ] || continue
  parch="$(tar -xOf "$pkg" .PKGINFO | awk -F' = ' '/^arch = /{print $2; exit}')"
  case "$parch" in
    x86_64|aarch64)
      mkdir -p "arch/$parch"
      cp "$pkg" "arch/$parch/"
      ;;
    any)
      # arch=any packages go into every architecture directory
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

for dir in arch/*/; do
  parch="$(basename "$dir")"
  shopt -s nullglob
  pkgs=("$dir"*.pkg.tar.zst)
  shopt -u nullglob
  [ ${#pkgs[@]} -gt 0 ] || { rmdir "$dir" 2>/dev/null || true; continue; }

  for f in "${pkgs[@]}"; do
    [ -f "$f.sig" ] || sign --detach-sign --no-armor -o "$f.sig" "$f"
  done

  docker run --rm -v "$PWD/$dir:/r" archlinux:latest \
    bash -c 'cd /r && rm -f grizak.db* grizak.files* && repo-add grizak.db.tar.zst *.pkg.tar.zst'

  sudo chown -R "$(id -u):$(id -g)" "$dir"
  rm -rf "$dir"{grizak.db,grizak.files}
  cp -f "$dir/grizak.db.tar.zst"    "$dir/grizak.db"
  cp -f "$dir/grizak.files.tar.zst" "$dir/grizak.files"
  sign --detach-sign --no-armor -o "$dir/grizak.db.sig" "$dir/grizak.db"
done

# ---------- Human-readable website meta ----------
python3 "$ROOT/tools/scripts/generate_package_meta.py" "$ROOT"
