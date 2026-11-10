import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const MESSAGES_SIMPLEMENT_AFFICHABLES: Record<number, string> = {
  413: 'La demande est trop volumineuse.',
  429: 'Trop de tentatives. Veuillez patienter une minute avant de réessayer.',
};

/**
 * Transforme toutes les erreurs en réponses simples et en français.
 * Les détails techniques des erreurs 5xx restent dans les journaux du serveur.
 */
@Catch()
export class FiltreExceptions implements ExceptionFilter {
  private readonly journal = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const contexte = host.switchToHttp();
    const reponse = contexte.getResponse<Response>();
    const statut =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    if (statut >= 500) {
      this.journal.error(
        exception instanceof Error
          ? (exception.stack ?? exception.message)
          : String(exception),
      );
    }

    let message: string | string[] =
      MESSAGES_SIMPLEMENT_AFFICHABLES[statut] ?? 'La demande n’a pas pu aboutir.';

    if (exception instanceof HttpException && statut < 500) {
      const contenu = exception.getResponse();

      if (typeof contenu === 'string') {
        message = contenu;
      } else if (contenu && typeof contenu === 'object' && 'message' in contenu) {
        const valeur = (contenu as { message: unknown }).message;

        if (typeof valeur === 'string' || Array.isArray(valeur)) {
          message = valeur as string | string[];
        }
      }
    }

    if (statut === 500) {
      message = 'Une erreur inattendue est survenue. Veuillez réessayer dans un instant.';
    }

    if (MESSAGES_SIMPLEMENT_AFFICHABLES[statut]) {
      message = MESSAGES_SIMPLEMENT_AFFICHABLES[statut];
    }

    if (statut === 404 && Array.isArray(message) === false && message.startsWith('Cannot ')) {
      message = 'La ressource demandée est introuvable.';
    }

    reponse.status(statut).json({ statusCode: statut, message });
  }
}
