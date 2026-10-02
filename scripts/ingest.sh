#!/usr/bin/env bash
set -euo pipefail
ROOT="$PWD"
cd site
touch .nojekyll
gpg --armor --export "$GPG_KEY_ID" > key.gpg
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
    dpkg-scanpackages --arch "$arch" pool > "$d/Packages"
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
createrepo_c --update rpm
sign --detach-sign --armor rpm/repodata/repomd.xml

# ---------- pacman ----------
mkdir -p arch/x86_64
cp "$ROOT"/incoming/*.pkg.tar.zst arch/x86_64/ 2>/dev/null || true
for f in arch/x86_64/*.pkg.tar.zst; do
  [ -f "$f.sig" ] || sign --detach-sign --no-armor -o "$f.sig" "$f"
done
docker run --rm -v "$PWD/arch/x86_64:/r" archlinux:latest \
  bash -c 'cd /r && rm -f grizak.db* grizak.files* && repo-add grizak.db.tar.zst *.pkg.tar.zst'
sudo chown -R "$(id -u):$(id -g)" arch
# Pages doesn't like symlinks, so make real copies
cp -f arch/x86_64/grizak.db.tar.zst    arch/x86_64/grizak.db
cp -f arch/x86_64/grizak.files.tar.zst arch/x86_64/grizak.files
sign --detach-sign --no-armor -o arch/x86_64/grizak.db.sig arch/x86_64/grizak.db