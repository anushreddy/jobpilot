import { writeFile, readFile, unlink, mkdir } from "fs/promises";
import path from "path";
import type { StorageDriver } from "./types";

/**
 * Local-disk storage for development. Mirrors the same key layout as S3 so
 * code paths are identical — keys map to files under ./uploads/<key>.
 */
export class LocalStorage implements StorageDriver {
  private root = path.join(process.cwd(), "uploads");

  private abs(key: string): string {
    return path.join(this.root, key);
  }

  async put(key: string, body: Buffer): Promise<string> {
    const absPath = this.abs(key);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, body);
    return key;
  }

  async get(key: string): Promise<Buffer> {
    return readFile(this.abs(key));
  }

  async delete(key: string): Promise<void> {
    await unlink(this.abs(key)).catch(() => {});
  }

  async getDownloadUrl(key: string): Promise<string> {
    // Served through an app route that streams the file from disk.
    // Key segments are kept as-is (route is a catch-all).
    return `/api/files/${key}`;
  }
}
