import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

interface SessionAdministrateur {
  email: string;
  expireLe: number;
}

const DUREE_SESSION = 12 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, SessionAdministrateur>();
  private readonly emailAdmin: string;
  private readonly motDePasseAdmin: string;

  constructor(configuration: ConfigService) {
    const email = configuration.get<string>('ADMIN_EMAIL')?.trim().toLowerCase();
    const motDePasse = configuration.get<string>('ADMIN_MOT_DE_PASSE');

    if (!email || !motDePasse) {
      throw new Error(
        'ADMIN_EMAIL et ADMIN_MOT_DE_PASSE sont requis. Renseignez-les dans server/.env.',
      );
    }

    if (motDePasse.length < 12) {
      throw new Error(
        'ADMIN_MOT_DE_PASSE doit contenir au moins 12 caractères pour résister aux attaques par force brute.',
      );
    }

    this.emailAdmin = email;
    this.motDePasseAdmin = motDePasse;
  }

  private empreinte(valeur: string) {
    return createHash('sha256').update(valeur).digest();
  }

  private correspond(valeurSaisie: string, valeurAttendue: string) {
    return timingSafeEqual(this.empreinte(valeurSaisie), this.empreinte(valeurAttendue));
  }

  connexion(email: string, motDePasse: string) {
    const emailSaisi = email.trim().toLowerCase();
    const emailValide = this.correspond(emailSaisi, this.emailAdmin);
    const motDePasseValide = this.correspond(motDePasse, this.motDePasseAdmin);

    if (!emailValide || !motDePasseValide) {
      throw new UnauthorizedException('E-mail ou mot de passe incorrect.');
    }

    // Purge des sessions expirées pour éviter l'accumulation en mémoire
    for (const [ancienJeton, session] of this.sessions) {
      if (session.expireLe <= Date.now()) {
        this.sessions.delete(ancienJeton);
      }
    }

    const jeton = randomBytes(32).toString('hex');
    const expireLe = Date.now() + DUREE_SESSION;
    this.sessions.set(jeton, { email: this.emailAdmin, expireLe });

    return {
      jeton,
      administrateur: { email: this.emailAdmin },
      expireLe: new Date(expireLe).toISOString(),
    };
  }

  verifier(jeton: string) {
    const session = this.sessions.get(jeton);

    if (!session) {
      return null;
    }

    if (session.expireLe <= Date.now()) {
      this.sessions.delete(jeton);
      return null;
    }

    return session;
  }

  deconnecter(jeton: string) {
    this.sessions.delete(jeton);
    return { message: 'Déconnexion effectuée.' };
  }
}
