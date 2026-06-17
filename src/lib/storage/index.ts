import { LocalStorage } from "./local";
import { S3Storage } from "./s3";
import type { StorageDriver } from "./types";

/**
 * Returns the active storage driver based on STORAGE_DRIVER.
 *   STORAGE_DRIVER=local  → local disk (default, dev)
 *   STORAGE_DRIVER=s3     → AWS S3 (deployment)
 *
 * Singleton so the S3 client / credentials are initialised once per process.
 */
let instance: StorageDriver | null = null;

export function getStorage(): StorageDriver {
  if (instance) return instance;

  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  instance = driver === "s3" ? new S3Storage() : new LocalStorage();
  return instance;
}

export type { StorageDriver };
export * from "./keys";
