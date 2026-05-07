import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

const DEFAULT_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class StorageService {
  constructor(private readonly firebase: FirebaseService) {}

  private get bucket() {
    return this.firebase.storage.bucket();
  }

  async getReadUrl(path: string, ttlMs = DEFAULT_TTL_MS): Promise<string> {
    const file = this.bucket.file(path);
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + ttlMs,
    });
    return url;
  }

  async getUploadUrl(
    path: string,
    contentType = 'image/jpeg',
    ttlMs = DEFAULT_TTL_MS,
  ): Promise<string> {
    const file = this.bucket.file(path);
    const [url] = await file.getSignedUrl({
      action: 'write',
      expires: Date.now() + ttlMs,
      contentType,
    });
    return url;
  }

  async exists(path: string): Promise<boolean> {
    const [exists] = await this.bucket.file(path).exists();
    return exists;
  }

  async delete(path: string): Promise<void> {
    await this.bucket.file(path).delete({ ignoreNotFound: true });
  }
}
