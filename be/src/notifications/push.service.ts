import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushPayload {
  uid: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  constructor(
    private readonly users: UsersService,
    private readonly firebase: FirebaseService,
  ) {}

  async send(payload: PushPayload): Promise<void> {
    const user = await this.users.findByUid(payload.uid);
    if (!user) return;

    // Send via FCM (web) if a webPushToken is registered
    if (user.webPushToken) {
      try {
        const messaging = (
          await import('firebase-admin/messaging')
        ).getMessaging();
        await messaging.send({
          token: user.webPushToken,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: Object.fromEntries(
            Object.entries(payload.data ?? {}).map(([k, v]) => [
              k,
              String(v),
            ]),
          ),
        });
        this.logger.log(
          `FCM web push sent to ${payload.uid}: ${payload.title}`,
        );
      } catch (e) {
        const msg = (e as Error).message;
        this.logger.warn(`FCM web push failed for ${payload.uid}: ${msg}`);
        if (
          msg.includes('registration-token-not-registered') ||
          msg.includes('Requested entity was not found')
        ) {
          await this.users.update(payload.uid, { webPushToken: null });
        }
      }
    }

    const token = user.pushToken;
    if (!token) {
      if (!user.webPushToken) {
        this.logger.debug(`No push token for ${payload.uid} — skip`);
      }
      return;
    }

    try {
      const r = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify([
          {
            to: token,
            title: payload.title,
            body: payload.body,
            data: payload.data ?? {},
            sound: 'default',
            priority: 'high',
          },
        ]),
      });
      const j = (await r.json()) as {
        data?: Array<{ status?: string; message?: string; details?: unknown }>;
      };
      const result = j.data?.[0];
      if (result?.status === 'error') {
        this.logger.warn(
          `Push to ${payload.uid} (${token}) error: ${result.message ?? 'unknown'}`,
        );
        // If token invalid, clear it
        if (
          result.message?.includes('not a registered push notification recipient') ||
          result.message?.includes('DeviceNotRegistered')
        ) {
          await this.users.setPushToken(payload.uid, null);
        }
      } else {
        this.logger.log(`Push sent to ${payload.uid}: ${payload.title}`);
      }
    } catch (e) {
      this.logger.error(
        `Failed sending push to ${payload.uid}: ${(e as Error).message}`,
      );
    }
  }
}
