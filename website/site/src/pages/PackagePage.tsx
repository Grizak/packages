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

  if (pkg.loading) return <p className="text-gray-500">Loading…</p>;
  if (pkg.error) return <p className="text-red-600">{pkg.error}</p>;

  const v = pkg.data!;
  const versions =
    index.data?.packages.find((p) => p.name === name)?.versions ?? [];

  return (
    <article className="space-y-8">
      <header>
        <Link to="/" className="text-sm text-gray-500 hover:underline">
          ← All packages
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline gap-3">
          <h1 className="text-3xl font-bold">{v.name}</h1>
          <span className="font-mono text-gray-500">{v.version}</span>
        </div>
        {v.description && <p className="mt-2 text-gray-700">{v.description}</p>}

        <dl className="mt-4 grid grid-cols-[auto,1fr] gap-x-4 gap-y-1 text-sm">
          {v.website && (
            <>
              <dt className="text-gray-500">Website</dt>
              <dd>
                <a
                  href={v.website}
                  className="text-blue-600 hover:underline"
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
              <dt className="text-gray-500">Maintainer</dt>
              <dd>{v.maintainer}</dd>
            </>
          )}
        </dl>
      </header>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Install</h2>
        <div className="space-y-3">
          {(Object.keys(v.pkgs) as Manager[]).map((manager) => {
            const commands = [
              ...new Set(v.pkgs[manager]!.map((a) => a.installcommand)),
            ];
            return (
              <div key={manager}>
                <p className="mb-1 text-sm text-gray-500">{LABELS[manager]}</p>
                {commands.map((cmd) => (
                  <pre
                    key={cmd}
                    className="overflow-x-auto rounded-md bg-gray-900 p-3 font-mono text-sm text-gray-100"
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
        <h2 className="mb-3 text-xl font-semibold">Downloads</h2>
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200">
          {(Object.keys(v.pkgs) as Manager[]).flatMap((manager) =>
            v.pkgs[manager]!.map((a) => (
              <li
                key={a.path}
                className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
              >
                <div>
                  <span className="font-medium">{LABELS[manager]}</span>
                  <span className="ml-2 text-gray-500">
                    {formatBytes(a.size)}
                  </span>
                </div>
                <a
                  href={`${import.meta.env.BASE_URL}${a.path}`}
                  className="text-blue-600 hover:underline"
                >
                  {a.path.split("/").pop()}
                </a>
                <code className="w-full truncate font-mono text-xs text-gray-400">
                  sha256: {a.sha256}
                </code>
              </li>
            )),
          )}
        </ul>
      </section>

      {versions.length > 1 && (
        <section>
          <h2 className="mb-3 text-xl font-semibold">Other versions</h2>
          <div className="flex flex-wrap gap-2">
            {sortVersionsDesc(versions).map((ver) => (
              <Link
                key={ver}
                to={`/packages/${name}/${ver}`}
                className={`rounded-full border px-3 py-1 font-mono text-sm ${
                  ver === version
                    ? "border-gray-900 bg-gray-900 text-white"
                    : "border-gray-300 hover:bg-gray-100"
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
