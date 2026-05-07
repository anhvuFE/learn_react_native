import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app!: admin.app.App;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const path = this.config.get<string>(
      'FIREBASE_SERVICE_ACCOUNT_PATH',
      './firebase-service-account.json',
    );
    const absolute = resolve(process.cwd(), path);

    if (!existsSync(absolute)) {
      this.logger.warn(
        `Firebase service account not found at ${absolute}. ` +
          `Firestore/Storage calls will fail until you generate a key from ` +
          `Firebase Console → Project Settings → Service accounts.`,
      );
      return;
    }

    const serviceAccount = JSON.parse(
      readFileSync(absolute, 'utf-8'),
    ) as admin.ServiceAccount & { project_id?: string };

    const storageBucket =
      this.config.get<string>('FIREBASE_STORAGE_BUCKET') ??
      (serviceAccount.project_id
        ? `${serviceAccount.project_id}.firebasestorage.app`
        : undefined);

    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket,
    });

    this.logger.log(
      `Firebase Admin initialized (storageBucket=${storageBucket ?? 'none'})`,
    );
  }

  get firestore() {
    if (!this.app) {
      throw new Error(
        'Firebase Admin not initialized. Add firebase-service-account.json.',
      );
    }
    return admin.firestore();
  }

  get auth() {
    if (!this.app) {
      throw new Error(
        'Firebase Admin not initialized. Add firebase-service-account.json.',
      );
    }
    return admin.auth();
  }

  get storage() {
    if (!this.app) {
      throw new Error(
        'Firebase Admin not initialized. Add firebase-service-account.json.',
      );
    }
    return admin.storage();
  }
}
