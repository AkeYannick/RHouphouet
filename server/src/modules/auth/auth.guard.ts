import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { CLE_ROUTE_PUBLIQUE } from './public.decorator';

interface RequeteAuthentifiee {
  headers: Record<string, string | undefined>;
  administrateur?: { email: string; expireLe: number };
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const routePublique = this.reflector.getAllAndOverride<boolean>(CLE_ROUTE_PUBLIQUE, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (routePublique) {
      return true;
    }

    const requete = context.switchToHttp().getRequest<RequeteAuthentifiee>();
    const [type, jeton] = (requete.headers.authorization ?? '').split(' ');
    const session = type === 'Bearer' && jeton ? this.auth.verifier(jeton) : null;

    if (!session) {
      throw new UnauthorizedException('Votre session a expiré. Veuillez vous reconnecter.');
    }

    requete.administrateur = session;
    return true;
  }
}
