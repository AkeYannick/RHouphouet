import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../auth/public.decorator';
import {
  ConnexionLocataireDto,
  MessageLocataireDto,
  PaiementLocataireDto,
  VerifierCodeLocataireDto,
} from './dto/espace-locataire.dto';
import { EspacePublic } from './espace-public.decorator';
import { EspaceLocataireService } from './espace-locataire.service';
import { LocataireGuard } from './locataire.guard';
import { LocataireSessionsService } from './locataire-sessions.service';

interface RequeteLocataire {
  locataire?: { locataireId: string; expireLe: number };
}

function identifiant(requete: RequeteLocataire): string {
  return requete.locataire?.locataireId ?? '';
}

/**
 * API consommée par l'application mobile locataire.
 * Le @Public() de classe désactive le guard administrateur global :
 * l'authentification est assurée par LocataireGuard.
 */
@Public()
@Controller('espace-locataire')
@UseGuards(LocataireGuard)
export class EspaceLocataireController {
  constructor(
    private readonly service: EspaceLocataireService,
    private readonly sessions: LocataireSessionsService,
  ) {}

  @EspacePublic()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('connexion')
  @HttpCode(200)
  connexion(@Body() donnees: ConnexionLocataireDto) {
    return this.sessions.demanderCode(donnees.telephone);
  }

  @EspacePublic()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verifier')
  @HttpCode(200)
  verifier(@Body() donnees: VerifierCodeLocataireDto) {
    return this.sessions.verifierCode(donnees.telephone, donnees.code);
  }

  @EspacePublic()
  @Post('deconnexion')
  @HttpCode(200)
  deconnexion(@Headers('authorization') entete?: string) {
    const [type, jeton] = (entete ?? '').split(' ');
    return this.sessions.deconnecter(type === 'Bearer' && jeton ? jeton : '');
  }

  @Get('moi')
  moi(@Req() requete: RequeteLocataire) {
    return this.service.profil(identifiant(requete));
  }

  @Get('loyers')
  loyers(@Req() requete: RequeteLocataire) {
    return this.service.loyers(identifiant(requete));
  }

  @Get('paiements')
  paiements(@Req() requete: RequeteLocataire) {
    return this.service.listerPaiements(identifiant(requete));
  }

  @Post('paiements')
  payer(@Req() requete: RequeteLocataire, @Body() donnees: PaiementLocataireDto) {
    return this.service.enregistrerPaiement(identifiant(requete), donnees);
  }

  @Get('contrat')
  contrat(@Req() requete: RequeteLocataire) {
    return this.service.contratActif(identifiant(requete));
  }

  @Get('messages')
  messages(@Req() requete: RequeteLocataire) {
    return this.service.listerMessages(identifiant(requete));
  }

  @Post('messages')
  envoyerMessage(@Req() requete: RequeteLocataire, @Body() donnees: MessageLocataireDto) {
    return this.service.envoyerMessage(identifiant(requete), donnees);
  }
}
