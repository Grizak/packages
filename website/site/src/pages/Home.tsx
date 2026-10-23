import { Link } from "react-router-dom";
import { fetchIndex } from "../api";
import { useFetch } from "../useFetch";
import { sortVersionsDesc } from "../utils";

export default function Home() {
  const { data, error, loading } = useFetch(fetchIndex, []);

  if (loading) return <p className="text-gray-500">Loading packages…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <ul className="grid gap-4">
      {data!.packages.map((pkg) => {
        const latest = sortVersionsDesc(pkg.versions)[0];
        return (
          <li key={pkg.name}>
            <Link
              to={`/packages/${pkg.name}/${latest}`}
              className="block rounded-lg border border-gray-200 p-4 transition hover:border-gray-400 hover:bg-gray-50"
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{pkg.name}</h2>
                <span className="font-mono text-sm text-gray-500">
                  {latest}
                </span>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {pkg.versions.length} version
                {pkg.versions.length === 1 ? "" : "s"}
              </p>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
