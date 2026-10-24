import { Link, useNavigate, useParams } from "react-router-dom";
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
  const navigate = useNavigate();
  const pkg = useFetch(() => fetchVersion(name, version), [name, version]);
  const index = useFetch(fetchIndex, []);

  if (pkg.loading)
    return <p className="text-slate-400">Loading package details…</p>;
  if (pkg.error)
    return (
      <p role="alert" className="text-rose-300">
        {pkg.error}
      </p>
    );

  const v = pkg.data!;
  const versions =
    index.data?.packages.find((p) => p.name === name)?.versions ?? [];
  const sortedVersions = sortVersionsDesc(versions);

  return (
    <article className="mx-auto max-w-4xl space-y-10">
      <header>
        <Link
          to="/?section=packages"
          className="text-sm text-cyan-300 hover:text-cyan-200"
        >
          ← All packages
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 break-words text-3xl font-semibold text-white">
            {v.name}
          </h1>
          {sortedVersions.length > 1 ? (
            <label className="flex items-center gap-2 text-sm text-slate-400">
              Version
              <select
                value={version}
                onChange={(event) =>
                  navigate(`/packages/${name}/${event.target.value}`)
                }
                className="rounded-md border border-white/15 bg-slate-900 px-3 py-1.5 font-mono text-cyan-300 focus:border-cyan-300 focus:outline-none"
              >
                {sortedVersions.map((ver) => (
                  <option key={ver} value={ver}>
                    {ver}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <span className="font-mono text-cyan-300">{v.version}</span>
          )}
        </div>
        {v.description && (
          <p className="mt-2 text-slate-400">{v.description}</p>
        )}

        <dl className="mt-5 grid grid-cols-[auto,minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
          {v.website && (
            <>
              <dt className="text-slate-500">Website</dt>
              <dd className="min-w-0 break-all">
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
              <dd className="min-w-0 break-words">{v.maintainer}</dd>
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
                  <pre key={cmd} className="code-panel">
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
                  className="min-w-0 break-all text-cyan-300 hover:underline"
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

    </article>
  );
}
