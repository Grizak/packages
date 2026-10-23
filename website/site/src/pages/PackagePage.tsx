import { Link, useParams } from "react-router-dom";
import { fetchIndex, fetchVersion } from "../api";
import { useFetch } from "../useFetch";
import { formatBytes, sortVersionsDesc } from "../utils";
import type { Manager } from "../types";

const LABELS: Record<Manager, string> = {
  apt: "Debian / Ubuntu",
  rpm: "Fedora / RHEL",
  arch: "Arch",
};

export default function PackagePage() {
  const { name = "", version = "" } = useParams();
  const pkg = useFetch(() => fetchVersion(name, version), [name, version]);
  const index = useFetch(fetchIndex, []);

  if (pkg.loading) return <p className="text-slate-400">Loading package details…</p>;
  if (pkg.error) return <p role="alert" className="text-rose-300">{pkg.error}</p>;

  const v = pkg.data!;
  const versions =
    index.data?.packages.find((p) => p.name === name)?.versions ?? [];

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      <header>
        <Link to="/" className="text-sm text-cyan-300 hover:text-cyan-200">
          ← All packages
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-semibold text-white">{v.name}</h1>
          <span className="font-mono text-cyan-300">{v.version}</span>
        </div>
        {v.description && <p className="mt-2 text-slate-400">{v.description}</p>}

        <dl className="mt-5 grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
          {v.website && (
            <>
              <dt className="text-slate-500">Website</dt>
              <dd>
                <a
                  href={v.website}
                  className="text-cyan-300 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {v.website}
                </a>
              </dd>
            </>
          )}
          {v.maintainer && (
            <>
              <dt className="text-slate-500">Maintainer</dt>
              <dd>{v.maintainer}</dd>
            </>
          )}
        </dl>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-white">Install</h2>
        <div className="space-y-3">
          {(Object.keys(v.pkgs) as Manager[]).map((manager) => {
            const commands = [
              ...new Set(v.pkgs[manager]!.map((a) => a.installcommand)),
            ];
            return (
              <div key={manager}>
                <p className="mb-1 text-sm text-slate-400">{LABELS[manager]}</p>
                {commands.map((cmd) => (
                  <pre
                    key={cmd}
                    className="code-panel"
                  >
                    {cmd}
                  </pre>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold text-white">Downloads</h2>
        <ul className="divide-y divide-white/10 rounded-lg border border-white/10 bg-white/[0.02]">
          {(Object.keys(v.pkgs) as Manager[]).flatMap((manager) =>
            v.pkgs[manager]!.map((a) => (
              <li
                key={a.path}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{LABELS[manager]}</span>
                  <span className="ml-2 text-slate-500">
                    {formatBytes(a.size)}
                  </span>
                </div>
                <a
                  href={`${import.meta.env.BASE_URL}${a.path}`}
                  className="text-cyan-300 hover:underline"
                >
                  {a.path.split("/").pop()}
                </a>
                <code className="w-full truncate font-mono text-xs text-slate-500">
                  sha256: {a.sha256}
                </code>
              </li>
            )),
          )}
        </ul>
      </section>

      {versions.length > 1 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold text-white">Other versions</h2>
          <div className="flex flex-wrap gap-2">
            {sortVersionsDesc(versions).map((ver) => (
              <Link
                key={ver}
                to={`/packages/${name}/${ver}`}
                className={`rounded-full border px-3 py-1 font-mono text-sm ${
                  ver === version
                    ? "border-cyan-300 bg-cyan-300 text-slate-950"
                    : "border-white/15 text-slate-300 hover:border-cyan-300/50 hover:bg-white/5"
                }`}
              >
                {ver}
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
