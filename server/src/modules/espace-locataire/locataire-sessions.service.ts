import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

const DUREE_CODE = 5 * 60 * 1000; // validité d'un code : 5 minutes
const DUREE_SESSION = 7 * 24 * 60 * 60 * 1000; // validité d'une session : 7 jours
const DELAI_RENVOI = 30 * 1000; // délai minimum entre deux demandes de code
const INTERVALLE_NETTOYAGE = 10 * 60 * 1000; // purge des entrées expirées
const MAX_TENTATIVES = 5;

interface CodeOtp {
  code: string;
  expireLe: number;
  tentatives: number;
}

interface SessionLocataire {
  locataireId: string;
  expireLe: number;
}

/** Uniformise les numéros : « 07 08 09 10 11 » et « +225 07 08 09 10 11 » deviennent identiques */
export function normaliserTelephone(valeur: string): string {
  const digits = valeur.replace(/\D/g, '');

  // Numéro ivoirien à 10 chiffres sans indicatif
  if (digits.length === 10) {
    return `+225${digits}`;
  }

  // Déjà avec indicatif (225...) ou autre format international
  return `+${digits}`;
}

/** Comparaison de deux chaînes à temps constant (évite les attaques par chronométrage) */
function memeValeur(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

@Injectable()
export class LocataireSessionsService implements OnModuleInit, OnModuleDestroy {
  private readonly codes = new Map<string, CodeOtp>();
  private readonly sessions = new Map<string, SessionLocataire>();
  private readonly dernierEnvoi = new Map<string, number>();

  /** Désactivé par défaut : il faut écrire EXPOSE_OTP=true dans le .env pour l'activer */
  private readonly exposerCode: boolean;
  private nettoyage?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configuration: ConfigService,
  ) {
    this.exposerCode = this.configuration.get<string>('EXPOSE_OTP') === 'true';

    // Garde-fou : exposer le code permettrait de se connecter sans posséder le téléphone
    if (this.exposerCode && this.configuration.get<string>('NODE_ENV') === 'production') {
      throw new Error('EXPOSE_OTP doit être désactivé en production.');
    }
  }

  onModuleInit() {
    this.nettoyage = setInterval(() => this.purger(), INTERVALLE_NETTOYAGE);
    this.nettoyage.unref(); // n'empêche pas l'arrêt du processus
  }

  onModuleDestroy() {
    if (this.nettoyage) clearInterval(this.nettoyage);
  }

  /** Supprime les codes, sessions et délais expirés pour ne pas saturer la mémoire */
  private purger() {
    const maintenant = Date.now();

    for (const [cle, entree] of this.codes) {
      if (entree.expireLe <= maintenant) this.codes.delete(cle);
    }
    for (const [jeton, session] of this.sessions) {
      if (session.expireLe <= maintenant) this.sessions.delete(jeton);
    }
    for (const [cle, date] of this.dernierEnvoi) {
      if (maintenant - date >= DELAI_RENVOI) this.dernierEnvoi.delete(cle);
    }
  }

  /**
   * Cherche un locataire actif par numéro.
   * TODO performance : ajouter un champ indexé `telephoneNormalise` dans Prisma
   * et remplacer ce parcours par un `findFirst({ where: { telephoneNormalise } })`.
   */
  async trouverLocataire(telephone: string, avecAppartement = false) {
    const normalise = normaliserTelephone(telephone);
    const locataires = await this.prisma.locataire.findMany({
      where: { actif: true },
      ...(avecAppartement ? { include: { appartement: true } } : {}),
    });

    return (
      locataires.find((locataire) => normaliserTelephone(locataire.telephone) === normalise) ??
      null
    );
  }

  async demanderCode(telephone: string) {
    const locataire = await this.trouverLocataire(telephone);

    if (!locataire) {
      throw new NotFoundException(
        "Ce numéro n'est associé à aucun logement. Contactez votre bailleur.",
      );
    }

    const cle = normaliserTelephone(telephone);

    // Limite les demandes répétées (et les futurs coûts de SMS)
    const dernier = this.dernierEnvoi.get(cle) ?? 0;
    if (Date.now() - dernier < DELAI_RENVOI) {
      throw new HttpException(
        'Veuillez patienter avant de demander un nouveau code.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    this.dernierEnvoi.set(cle, Date.now());

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expireLe = Date.now() + DUREE_CODE;

    this.codes.set(cle, { code, expireLe, tentatives: 0 });

    // Le code n'apparaît dans les logs que si l'exposition est activée (développement)
    if (this.exposerCode) {
      console.log(`[espace-locataire] Code de connexion pour ${cle} : ${code}`);
    }

    // TODO : envoyer le SMS ici quand le fournisseur sera branché

    return {
      message: 'Un code à 6 chiffres vous a été envoyé par SMS.',
      expireLe: new Date(expireLe).toISOString(),
      ...(this.exposerCode ? { codeDemo: code } : {}),
    };
  }

  async verifierCode(telephone: string, code: string) {
    const cle = normaliserTelephone(telephone);
    const entree = this.codes.get(cle);

    if (!entree || entree.expireLe <= Date.now()) {
      this.codes.delete(cle);
      throw new BadRequestException('Code expiré. Demandez un nouveau code.');
    }

    if (entree.tentatives >= MAX_TENTATIVES) {
      this.codes.delete(cle);
      throw new BadRequestException('Trop de tentatives. Demandez un nouveau code.');
    }

    if (!memeValeur(entree.code, code)) {
      entree.tentatives += 1;
      throw new UnauthorizedException('Code incorrect. Veuillez réessayer.');
    }

    // Une seule requête : le locataire avec son appartement
    const locataire = await this.trouverLocataire(telephone, true);

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    this.codes.delete(cle); // usage unique
    this.dernierEnvoi.delete(cle);

    const jeton = randomBytes(32).toString('hex');
    const expireLe = Date.now() + DUREE_SESSION;
    this.sessions.set(jeton, { locataireId: locataire.id, expireLe });

    return {
      jeton,
      expireLe: new Date(expireLe).toISOString(),
      locataire,
    };
  }

  verifierJeton(jeton: string): SessionLocataire | null {
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