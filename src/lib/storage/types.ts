/** Storage driver abstraction — implemented by both local-disk and S3 backends. */
export interface StorageDriver {
  /** Store bytes at `key`. Returns the key for convenience. */
  put(key: string, body: Buffer, contentType?: string): Promise<string>;
  /** Read bytes stored at `key`. */
  get(key: string): Promise<Buffer>;
  /** Delete the object at `key` (no-op if missing). */
  delete(key: string): Promise<void>;
  /**
   * A URL the browser can use to fetch the object. For S3 this is a
   * time-limited presigned URL; for local it's an app route.
   */
  getDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
