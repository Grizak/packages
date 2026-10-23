import hashlib
import json
import subprocess
import sys
from pathlib import Path

root = Path(sys.argv[1])
site = root / "site"


def run(*args):
	return subprocess.check_output(args, text=True, stderr=subprocess.PIPE).strip()


def clean(value):
    # rpm prints "(none)" for unset tags
    return "" if value in ("(none)", "") else value

def field(fields, index):
    return clean(fields[index]) if index < len(fields) else ""

def deb_upstream(version):
    # "1:1.2.0-1ubuntu1" -> "1.2.0"
    without_epoch = version.split(":", 1)[-1]
    return without_epoch.rsplit("-", 1)[0]

def arch_upstream(version):
    # "1:0.2.2-1" -> "0.2.2"
    without_epoch = version.split(":", 1)[-1]
    return without_epoch.rsplit("-", 1)[0]

def deb_metadata(path):
	# Description goes last so its continuation lines don't shift the other indexes
	fields = run(
		"dpkg-deb", "-W",
		"--showformat=${Package}\\n${Version}\\n${Maintainer}\\n${Homepage}\\n${Description}\\n",
		str(path),
	).splitlines()
	name = field(fields, 0)
	return {
		"name": name,
		"version": deb_upstream(field(fields, 1)),
		"maintainer": field(fields, 2),
		"website": field(fields, 3),
		"description": field(fields, 4),
		"install": f"sudo apt install {name}",
		"manager": "apt",
	}


def rpm_metadata(path):
	fields = run(
		"rpm", "-qp", "--queryformat",
		"%{NAME}\\n%{VERSION}\\n%{SUMMARY}\\n%{URL}\\n%{PACKAGER}\\n",
		str(path),
	).splitlines()
	name = field(fields, 0)
	return {
		"name": name,
		"version": field(fields, 1),
		"description": field(fields, 2),
		"website": field(fields, 3),
		"maintainer": field(fields, 4),
		"install": f"sudo dnf install {name}",
		"manager": "rpm",
	}


def arch_metadata(path):
	info = run("tar", "-xOf", str(path), ".PKGINFO")
	fields = {}
	for line in info.splitlines():
		if " = " in line:
			key, value = line.split(" = ", 1)
			fields.setdefault(key, []).append(value)

	name = fields["pkgname"][0]
	return {
		"name": name,
		"version": arch_upstream(fields["pkgver"][0]),
		"description": fields.get("pkgdesc", [""])[0],
		"website": fields.get("url", [""])[0],
		"maintainer": fields.get("packager", [""])[0],
		"install": f"sudo pacman -S {name}",
		"manager": "arch",
	}


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
