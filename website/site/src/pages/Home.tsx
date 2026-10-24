import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchIndex } from "../api";
import { useFetch } from "../useFetch";
import { sortVersionsDesc } from "../utils";

export default function Home() {
  const { data, error, loading } = useFetch(fetchIndex, []);
  const { search } = useLocation();

  useEffect(() => {
    const section = new URLSearchParams(search).get("section");
    if (!section) return;

    document.getElementById(section)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [search]);

  return (
    <>
      <header id="top" className="mb-12 sm:mb-16">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link
            to="/?section=top"
            className="flex items-center gap-3 text-sm font-semibold tracking-wide text-white sm:text-base"
          >
            <span className="grid size-9 place-items-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 font-mono text-sm text-cyan-200">
              G
            </span>
            GRIZAK <span className="text-slate-500">/ PACKAGES</span>
          </Link>
          <nav
            aria-label="Main navigation"
            className="flex w-full justify-between text-sm text-slate-400 sm:w-auto sm:justify-start sm:gap-5"
          >
            <Link
              className="inline-flex min-h-11 items-center px-2 transition hover:text-cyan-200 sm:px-0"
              to="/?section=packages"
            >
              Packages
            </Link>
            <Link
              className="inline-flex min-h-11 items-center px-2 transition hover:text-cyan-200 sm:px-0"
              to="/?section=install"
            >
              Quick start
            </Link>
          </nav>
        </div>

        <div className="relative isolate overflow-hidden py-12 sm:py-24">
          <div className="pointer-events-none absolute -right-24 -top-12 -z-10 size-80 rounded-full bg-cyan-400/10 blur-3xl" />
          <p className="mb-5 font-mono text-xs uppercase tracking-[0.28em] text-cyan-300">
            Linux package repositories{" "}
            <span className="text-slate-600">//</span> online
          </p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            Packages, delivered
            <span className="block text-cyan-300">
              straight to your system.
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
            A signed home for Grizak packages across Debian, Fedora, and Arch.
            Add the repository once, then install and update with your native
            package manager.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {["DEBIAN / UBUNTU", "FEDORA / RHEL", "ARCH LINUX"].map(
              (platform) => (
                <span
                  key={platform}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 font-mono text-[11px] tracking-wider text-slate-300"
                >
                  {platform}
                </span>
              ),
            )}
          </div>
          <Link
            to="/?section=install"
            className="mt-9 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 sm:w-auto"
          >
            Configure a repository <span aria-hidden="true">↓</span>
          </Link>
        </div>
      </header>

      <section
        aria-label="Supported platforms"
        className="mb-12 grid gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 sm:grid-cols-3 sm:p-5"
      >
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Debian / Ubuntu
          </p>
          <p className="mt-1 text-sm text-slate-200">
            APT <span className="text-slate-500">·</span> amd64, arm64
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Fedora / RHEL
          </p>
          <p className="mt-1 text-sm text-slate-200">
            RPM <span className="text-slate-500">·</span> depends on package
            build
          </p>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
            Arch Linux
          </p>
          <p className="mt-1 text-sm text-slate-200">
            Pacman <span className="text-slate-500">·</span> x86_64
          </p>
        </div>
      </section>

      <section
        id="packages"
        className="scroll-mt-8 border-t border-white/10 py-10 sm:py-12"
      >
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
              01 / Catalog
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Available packages
            </h2>
          </div>
          {data && (
            <p className="font-mono text-sm text-slate-500">
              {data.packages.length} packages indexed
            </p>
          )}
        </div>
        {loading && (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            Loading package index…
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-400/20 bg-rose-400/5 p-5 text-sm text-rose-300"
          >
            Unable to load packages: {error}
          </p>
        )}
        {data && data.packages.length === 0 && (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
            No packages have been published yet.
          </p>
        )}
        {data && data.packages.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.packages.map((pkg) => {
              const latest = sortVersionsDesc(pkg.versions)[0];
              return (
                <li key={pkg.name}>
                  <Link
                    to={`/packages/${pkg.name}/${latest}`}
                    className="group block rounded-lg border border-white/10 bg-white/[0.025] p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/40 hover:bg-cyan-300/[0.04]"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-lg font-semibold text-white transition group-hover:text-cyan-200">
                        {pkg.name}
                      </h3>
                      <span className="font-mono text-xs text-cyan-300">
                        {latest}
                      </span>
                    </div>
                    <p className="mt-3 font-mono text-xs text-slate-500">
                      {pkg.versions.length} version
                      {pkg.versions.length === 1 ? "" : "s"}{" "}
                      <span className="float-right text-cyan-400/70">
                        OPEN ↗
                      </span>
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section
        id="install"
        className="scroll-mt-8 border-t border-white/10 py-10 sm:py-12"
      >
        <div className="mb-8 max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
            02 / Quick start
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Connect your package manager
          </h2>
          <p className="mt-3 leading-6 text-slate-400">
            Import the repository signing key and add the matching source for
            your distribution. Replace{" "}
            <code className="text-cyan-200">&lt;package-name&gt;</code> with the
            package you want to install.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="min-w-0 rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Debian / Ubuntu</h3>
              <span className="rounded border border-cyan-300/20 px-2 py-1 font-mono text-[10px] text-cyan-200">
                APT
              </span>
            </div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Import key &amp; add repository
            </p>
            <pre className="code-panel">
              <code>{`curl -fsSL https://pkg.isaksweb.xyz/key.asc | \\
  sudo gpg --dearmor -o /usr/share/keyrings/grizak-archive-keyring.gpg

echo "deb [signed-by=/usr/share/keyrings/grizak-archive-keyring.gpg] https://pkg.isaksweb.xyz/apt stable main" | \\
  sudo tee /etc/apt/sources.list.d/grizak.list

sudo apt update
sudo apt install <package-name>`}</code>
            </pre>
          </article>

          <article className="min-w-0 rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Fedora / RHEL</h3>
              <span className="rounded border border-violet-300/20 px-2 py-1 font-mono text-[10px] text-violet-200">
                RPM
              </span>
            </div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Import key
            </p>
            <pre className="code-panel">
              <code>{`sudo rpm --import https://pkg.isaksweb.xyz/key.asc`}</code>
            </pre>
            <p className="mb-2 mt-5 text-xs tracking-wider text-slate-500">
              CREATE /etc/yum.repos.d/grizak.repo
            </p>
            <pre className="code-panel">
              <code>{`[grizak]
name=Grizak Packages
baseurl=https://pkg.isaksweb.xyz/rpm
enabled=1
gpgcheck=1
repo_gpgcheck=1
gpgkey=https://pkg.isaksweb.xyz/key.asc`}</code>
            </pre>
            <pre className="code-panel mt-3">
              <code>{`sudo dnf install <package-name>`}</code>
            </pre>
          </article>

          <article className="min-w-0 rounded-xl border border-white/10 bg-slate-900/70 p-4 sm:p-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-semibold text-white">Arch Linux</h3>
              <span className="rounded border border-emerald-300/20 px-2 py-1 font-mono text-[10px] text-emerald-200">
                PACMAN
              </span>
            </div>
            <p className="mb-2 text-xs uppercase tracking-wider text-slate-500">
              Verify fingerprint before trusting key
            </p>
            <pre className="code-panel">
              <code>{`curl -fsSL https://pkg.isaksweb.xyz/key.asc -o grizak.asc
curl -fsSL https://pkg.isaksweb.xyz/fingerprint.txt
gpg --with-colons --show-keys grizak.asc | awk -F: '/^fpr:/ {print $10; exit}'`}</code>
            </pre>
            <p className="mt-3 text-xs leading-5 text-amber-200/80">
              The fingerprints must match. If they do not, stop and do not
              continue.
            </p>
            <p className="mb-2 mt-5 text-xs uppercase tracking-wider text-slate-500">
              Import key and sign it locally
            </p>
            <pre className="code-panel">
              <code>{`FPR=$(gpg --with-colons --show-keys grizak.asc | awk -F: '/^fpr:/ {print $10; exit}')
sudo pacman-key --add grizak.asc
sudo pacman-key --lsign-key "$FPR"`}</code>
            </pre>
            <p className="mb-2 mt-5 text-xs uppercase tracking-wider text-slate-500">
              Add to /etc/pacman.conf
            </p>
            <pre className="code-panel">
              <code>{`[grizak]
SigLevel = Required DatabaseOptional
Server = https://pkg.isaksweb.xyz/arch/$arch`}</code>
            </pre>
            <pre className="code-panel mt-3">
              <code>{`sudo pacman -Sy
sudo pacman -S <package-name>`}</code>
            </pre>
          </article>
        </div>
      </section>

      <section className="grid gap-8 border-t border-white/10 py-10 sm:py-12 md:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
            03 / Trust
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            Signed repository metadata
          </h2>
          <p className="mt-3 leading-6 text-slate-400">
            Repository metadata is cryptographically signed. Import the
            repository signing key before installing packages so your package
            manager can verify what it downloads.
          </p>
          <dl className="mt-6 divide-y divide-white/10 rounded-lg border border-white/10">
            <div className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-slate-400">APT</dt>
              <dd className="min-w-0 break-words text-right font-mono text-slate-200">
                InRelease + Release.gpg
              </dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-slate-400">RPM</dt>
              <dd className="min-w-0 break-words text-right font-mono text-slate-200">Signed repomd.xml</dd>
            </div>
            <div className="flex justify-between gap-4 px-4 py-3 text-sm">
              <dt className="text-slate-400">Arch</dt>
              <dd className="min-w-0 break-words text-right font-mono text-slate-200">
                Signed packages + database
              </dd>
            </div>
          </dl>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
            04 / Repository map
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-white">
            One source, three formats
          </h2>
          <pre className="code-panel mt-5">
            <code>{`apt/
├── pool/
└── dists/
rpm/
└── repodata/
arch/
└── x86_64/
key.asc`}</code>
          </pre>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-400">
            <li>
              <code className="text-cyan-200">apt/</code> — Debian repository
              metadata and packages.
            </li>
            <li>
              <code className="text-cyan-200">rpm/</code> — RPM metadata
              generated by createrepo_c.
            </li>
            <li>
              <code className="text-cyan-200">arch/</code> — Pacman database and
              package files.
            </li>
            <li>
              <code className="text-cyan-200">key.asc</code> — public key for
              verifying repository metadata.
            </li>
          </ul>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 py-6 text-xs text-slate-500">
        <span>
          GRIZAK PACKAGES <span className="text-slate-700">/</span> Linux
          package repositories
        </span>
        <span>
          Infrastructure and automation licensed under MIT unless otherwise
          stated.
        </span>
      </footer>
    </>
  );
}
