import hashlib
import json
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
site = root / "site"


def run(*args):
	return subprocess.check_output(args, text=True, stderr=subprocess.PIPE).strip()


def deb_upstream(version):
	# "1:1.2.0-1ubuntu1" -> "1.2.0"
	without_epoch = version.split(":", 1)[-1]
	return without_epoch.rsplit("-", 1)[0]


def deb_metadata(path):
	fields = run(
		"dpkg-deb", "-W",
		"--showformat=${Package}\\n${Version}\\n${Description}\\n",
		str(path),
	).splitlines()
	name, raw_version = fields[:2]
	description = fields[2] if len(fields) > 2 else ""
	return name, deb_upstream(raw_version), description, f"sudo apt install {name}", "apt"


def rpm_metadata(path):
	# %{VERSION} is upstream only; %{RELEASE} is the packaging revision
	fields = run("rpm", "-qp", "--queryformat", "%{NAME}\\n%{VERSION}\\n%{SUMMARY}\\n", str(path)).splitlines()
	name, version = fields[:2]
	return name, version, fields[2] if len(fields) > 2 else "", f"sudo dnf install {name}", "rpm"


def arch_upstream(version):
	# "1:0.2.2-1" -> "0.2.2"
	without_epoch = version.split(":", 1)[-1]
	return without_epoch.rsplit("-", 1)[0]


def arch_metadata(path):
	info = run("tar", "-xOf", str(path), ".PKGINFO")
	fields = {}
	for line in info.splitlines():
		if " = " in line:
			key, value = line.split(" = ", 1)
			fields.setdefault(key, []).append(value)

	name = fields["pkgname"][0]
	version = arch_upstream(fields["pkgver"][0])
	description = fields.get("pkgdesc", [""])[0]
	return name, version, description, f"sudo pacman -S {name}", "arch"


package_dirs = [
	(site / "apt" / "pool", "*.deb", deb_metadata),
	(site / "rpm", "*.rpm", rpm_metadata),
	(site / "arch", "*.pkg.tar.zst", arch_metadata),
]

packages = []
for directory, pattern, extract_metadata in package_dirs:
	if not directory.exists():
		continue

	for path in sorted(directory.rglob(pattern)):
		name, version, description, install, manager = extract_metadata(path)
		packages.append({
			"name": name,
			"version": version,
			"manager": manager,
			"path": path.relative_to(site).as_posix(),
			"size": path.stat().st_size,
			"sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
			"description": description,
			"install": install,
		})

output = root / "package-meta.json"
temporary = output.with_suffix(".json.tmp")
temporary.write_text(
	json.dumps({"packages": packages}, indent=2) + "\n",
	encoding="utf-8",
)
temporary.replace(output)
