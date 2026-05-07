import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { FamiliesService } from '../families/families.service';
import { FirebaseService } from '../firebase/firebase.service';
import { UserRole } from '../users/user.model';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebase: FirebaseService,
    private readonly users: UsersService,
    private readonly families: FamiliesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const gqlCtx = GqlExecutionContext.create(context);
    const ctxObj = gqlCtx.getContext<{
      req?: { headers?: Record<string, string> };
      user?: unknown;
    }>();
    const header = ctxObj.req?.headers?.authorization;

    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      throw new UnauthorizedException('Missing Bearer token');
    }
    const token = header.slice(7).trim();

    let decoded;
    try {
      decoded = await this.firebase.auth.verifyIdToken(token);
    } catch (e) {
      this.logger.warn(`Token verification failed: ${(e as Error).message}`);
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Custom claim from pairing custom-token signals child role
    const claimedRole = (decoded as { role?: string }).role;
    const claimedFamilyId = (decoded as { familyId?: string }).familyId;
    const role = claimedRole === 'child' ? UserRole.CHILD : UserRole.PARENT;

    // Look up profile; if missing (first sign-in), create with default
    let profile = await this.users.findByUid(decoded.uid);
    if (!profile) {
      profile = await this.users.ensureProfile({
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name,
        role,
        familyId: claimedFamilyId,
      });
    }

    // Parent without family → auto-create family + link
    if (profile.role === UserRole.PARENT && !profile.familyId) {
      const family = await this.families.getOrCreateForParent(profile.uid);
      await this.users.setFamilyId(profile.uid, family.id);
      profile = { ...profile, familyId: family.id };
    }

    ctxObj.user = profile;
    return true;
  }
}
