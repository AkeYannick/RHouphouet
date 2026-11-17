import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, randomInt } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

const DUREE_CODE = 5 * 60 * 1000;
const DUREE_SESSION = 7 * 24 * 60 * 60 * 1000;
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

  if (digits.length === 10) {
    return `+225${digits}`;
  }

  if (digits.length === 13 && digits.startsWith('225')) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

@Injectable()
export class LocataireSessionsService {
  private readonly codes = new Map<string, CodeOtp>();
  private readonly sessions = new Map<string, SessionLocataire>();

  constructor(private readonly prisma: PrismaService) {}

  async trouverLocataire(telephone: string) {
    const normalise = normaliserTelephone(telephone);
    const locataires = await this.prisma.locataire.findMany({
      where: { actif: true },
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
    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    const expireLe = Date.now() + DUREE_CODE;

    this.codes.set(cle, { code, expireLe, tentatives: 0 });

    // Sans fournisseur SMS, le code est journalisé côté serveur et renvoyé
    // au client mobile tant que EXPOSE_OTP n'est pas désactivé.
    console.log(`[espace-locataire] Code de connexion pour ${telephone} : ${code}`);
    const exposerCode = process.env.EXPOSE_OTP !== 'false';

    return {
      message: 'Un code à 6 chiffres vous a été envoyé par SMS.',
      expireLe: new Date(expireLe).toISOString(),
      ...(exposerCode ? { codeDemo: code } : {}),
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

    if (entree.code !== code) {
      entree.tentatives += 1;
      throw new UnauthorizedException('Code incorrect. Veuillez réessayer.');
    }

    const reference = await this.trouverLocataire(telephone);

    if (!reference) {
      throw new NotFoundException('Locataire introuvable');
    }

    const locataire = await this.prisma.locataire.findUnique({
      where: { id: reference.id },
      include: { appartement: true },
    });

    if (!locataire) {
      throw new NotFoundException('Locataire introuvable');
    }

    this.codes.delete(cle);

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
