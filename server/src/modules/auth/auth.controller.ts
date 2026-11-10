import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  Req,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { ConnexionDto } from './dto/connexion.dto';
import { Public } from './public.decorator';

interface RequeteAdministrateur {
  administrateur?: { email: string; expireLe: number };
}

@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('connexion')
  @HttpCode(200)
  connexion(@Body() donnees: ConnexionDto) {
    return this.service.connexion(donnees.email, donnees.motDePasse);
  }

  @Get('profil')
  profil(@Req() requete: RequeteAdministrateur) {
    return {
      email: requete.administrateur?.email ?? null,
      expireLe: requete.administrateur
        ? new Date(requete.administrateur.expireLe).toISOString()
        : null,
    };
  }

  @Public()
  @Post('deconnexion')
  @HttpCode(200)
  deconnexion(@Headers('authorization') entete?: string) {
    const [type, jeton] = (entete ?? '').split(' ');
    return this.service.deconnecter(type === 'Bearer' && jeton ? jeton : '');
  }
}
