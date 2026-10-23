package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
)

var (
	SitePath = flag.String("site-dir", "site/", "The path to the site directory")
	MetaPath = flag.String("meta-file", "package-meta.json", "The path to the metadata file")
)

type Metadata struct {
	Packages []Package `json:"packages"`
}

type Package struct {
	Name        string `json:"name"`
	Version     string `json:"version"`
	Manager     string `json:"manager"`
	Path        string `json:"path"`
	Size        int64  `json:"size"`
	SHA256      string `json:"sha256"`
	Description string `json:"description"`
	Install     string `json:"install"`
	Website     string `json:"website"`
	Maintainer  string `json:"maintainer"`
}

type Artifact struct {
	InstallCommand string `json:"installcommand"`
	Path           string `json:"path"`
	Size           int64  `json:"size"`
	SHA256         string `json:"sha256"`
}

type VersionFile struct {
	Name        string                `json:"name"`
	Version     string                `json:"version"`
	Pkgs        map[string][]Artifact `json:"pkgs"`
	Description string                `json:"description,omitempty"`
	Website     string                `json:"website"`
	Maintainer  string                `json:"maintainer"`
}

type PackageIndexEntry struct {
	Name     string   `json:"name"`
	Versions []string `json:"versions"`
}

type Index struct {
	Packages []PackageIndexEntry `json:"packages"`
}

var safeComponent = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9.+~_-]*$`)

func main() {
	flag.Parse()

	absSitePath, err := filepath.Abs(*SitePath)
	check(err)

	absMetaPath, err := filepath.Abs(*MetaPath)
	check(err)

	input, err := os.ReadFile(absMetaPath)
	check(err)

	var metadata Metadata
	check(json.Unmarshal(input, &metadata))

	// Clear the site/packages directory before generating new files
	packagesDir := filepath.Join(absSitePath, "packages")
	check(os.RemoveAll(packagesDir))
	check(os.MkdirAll(packagesDir, 0o755))

	byVersion := make(map[string]*VersionFile)
	for _, pkg := range metadata.Packages {
		if !safeComponent.MatchString(pkg.Name) ||
			!safeComponent.MatchString(pkg.Version) {
			fail("invalid package name or version: %q %q", pkg.Name, pkg.Version)
		}
		if !safeComponent.MatchString(pkg.Manager) {
			fail("invalid package manager: %q", pkg.Manager)
		}
		if pkg.Path == "" || filepath.IsAbs(pkg.Path) {
			fail("invalid path for %s %s", pkg.Name, pkg.Version)
		}

		key := pkg.Name + "\x00" + pkg.Version
		version, ok := byVersion[key]
		if !ok {
			version = &VersionFile{
				Name:        pkg.Name,
				Version:     pkg.Version,
				Pkgs:        make(map[string][]Artifact),
				Description: pkg.Description,
				Website:     pkg.Website,
				Maintainer:  pkg.Maintainer,
			}
			byVersion[key] = version
		}

		version.Pkgs[pkg.Manager] = append(version.Pkgs[pkg.Manager], Artifact{
			InstallCommand: pkg.Install,
			Path:           pkg.Path,
			Size:           pkg.Size,
			SHA256:         pkg.SHA256,
		})
	}

	versionsByName := make(map[string][]string)
	for _, version := range byVersion {
		for manager := range version.Pkgs {
			sort.Slice(version.Pkgs[manager], func(i, j int) bool {
				return version.Pkgs[manager][i].Path < version.Pkgs[manager][j].Path
			})
		}

		dir := filepath.Join(packagesDir, version.Name)
		check(os.MkdirAll(dir, 0o755))

		data, err := json.MarshalIndent(version, "", "  ")
		check(err)
		data = append(data, '\n')

		out := filepath.Join(dir, version.Version+".json")
		check(os.WriteFile(out, data, 0o644))

		versionsByName[version.Name] = append(
			versionsByName[version.Name],
			version.Version,
		)
	}

	index := Index{}
	for name, versions := range versionsByName {
		sort.Strings(versions)
		index.Packages = append(index.Packages, PackageIndexEntry{
			Name:     name,
			Versions: versions,
		})
	}

	sort.Slice(index.Packages, func(i, j int) bool {
		return index.Packages[i].Name < index.Packages[j].Name
	})

	data, err := json.MarshalIndent(index, "", "  ")
	check(err)
	data = append(data, '\n')

	check(os.MkdirAll(absSitePath, 0o755))
	check(os.WriteFile(filepath.Join(absSitePath, "index.json"), data, 0o644))
}

func check(err error) {
	if err != nil {
		fail("%v", err)
	}
}

func fail(format string, args ...any) {
	fmt.Fprintf(os.Stderr, format+"\n", args...)
	os.Exit(1)
}
