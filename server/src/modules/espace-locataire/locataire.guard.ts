import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CLE_ROUTE_ESPACE_PUBLIQUE,
} from './espace-public.decorator';
import { LocataireSessionsService } from './locataire-sessions.service';

interface RequeteEspaceLocataire {
  headers: Record<string, string | undefined>;
  locataire?: { locataireId: string; expireLe: number };
}

@Injectable()
export class LocataireGuard implements CanActivate {
  constructor(
    private readonly sessions: LocataireSessionsService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext) {
    const routePublique = this.reflector.getAllAndOverride<boolean>(
      CLE_ROUTE_ESPACE_PUBLIQUE,
      [context.getHandler(), context.getClass()],
    );

    if (routePublique) {
      return true;
    }

    const requete = context.switchToHttp().getRequest<RequeteEspaceLocataire>();
    const [type, jeton] = (requete.headers.authorization ?? '').split(' ');
    const session = type === 'Bearer' && jeton ? this.sessions.verifierJeton(jeton) : null;

    if (!session) {
      throw new UnauthorizedException(
        'Votre session a expiré. Veuillez vous reconnecter.',
      );
    }

    requete.locataire = session;
    return true;
  }
}
