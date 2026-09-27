import * as Crypto from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import type { SQLiteDatabase } from 'expo-sqlite';

import { getCachedAssetUri, upsertCachedAsset } from '@/db/repository';

const previewDir = new Directory(Paths.cache, 'label-previews');

function ensurePreviewDir(): void {
  if (!previewDir.exists) {
    previewDir.create({ intermediates: true });
  }
}

export async function hashRemoteUrl(url: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, url);
}

export async function resolvePreviewUri(
  db: SQLiteDatabase,
  remoteUrl: string,
): Promise<string> {
  const hash = await hashRemoteUrl(remoteUrl);
  const cached = await getCachedAssetUri(db, hash);
  if (cached) {
    const file = new File(cached);
    if (file.exists) {
      return cached;
    }
  }

  ensurePreviewDir();
  const extension = remoteUrl.includes('.webp') ? 'webp' : 'jpg';
  const dest = new File(previewDir, `${hash}.${extension}`);

  if (!dest.exists) {
    const downloaded = await File.downloadFileAsync(remoteUrl, dest);
    await upsertCachedAsset(db, hash, downloaded.uri, remoteUrl);
    return downloaded.uri;
  }

  await upsertCachedAsset(db, hash, dest.uri, remoteUrl);
  return dest.uri;
}
