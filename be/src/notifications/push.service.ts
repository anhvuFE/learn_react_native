import { Injectable, Logger } from '@nestjs/common';
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

  constructor(private readonly users: UsersService) {}

  async send(payload: PushPayload): Promise<void> {
    const user = await this.users.findByUid(payload.uid);
    const token = user?.pushToken;
    if (!token) {
      this.logger.debug(`No push token for ${payload.uid} — skip`);
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
