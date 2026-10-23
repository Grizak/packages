import type { Index, VersionFile } from "./types";

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`/${path}`);
  if (!res.ok) throw new Error(`${res.status} fetching ${path}`);
  return res.json() as Promise<T>;
}

export const fetchIndex = () => getJson<Index>("index.json");

export const fetchVersion = (name: string, version: string) =>
  getJson<VersionFile>(
    `packages/${encodeURIComponent(name)}/${encodeURIComponent(version)}.json`,
  );
