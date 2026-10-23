export type Manager = "apt" | "rpm" | "arch";

export interface IndexEntry {
  name: string;
  versions: string[];
}

export interface Index {
  packages: IndexEntry[];
}

export interface Artifact {
  installcommand: string;
  path: string;
  size: number;
  sha256: string;
}

export interface VersionFile {
  name: string;
  version: string;
  description?: string;
  website: string;
  maintainer: string;
  pkgs: Partial<Record<Manager, Artifact[]>>;
}
