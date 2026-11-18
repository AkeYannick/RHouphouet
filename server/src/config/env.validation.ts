import { plainToInstance } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

class VariablesEnvironnement {
  @IsOptional()
  @IsInt({ message: 'PORT doit être un entier' })
  @Min(1, { message: 'PORT doit être supérieur à 0' })
  @Max(65535, { message: 'PORT doit être inférieur à 65536' })
  PORT?: number;

  @IsString({ message: 'DATABASE_URL doit être une chaîne' })
  @IsNotEmpty({ message: 'DATABASE_URL est requis' })
  DATABASE_URL!: string;

  @IsString({ message: 'ADMIN_EMAIL doit être une chaîne' })
  @IsNotEmpty({ message: 'ADMIN_EMAIL est requis' })
  ADMIN_EMAIL!: string;

  @IsString({ message: 'ADMIN_MOT_DE_PASSE doit être une chaîne' })
  @MinLength(12, {
    message: 'ADMIN_MOT_DE_PASSE doit contenir au moins 12 caractères',
  })
  ADMIN_MOT_DE_PASSE!: string;

  @IsOptional()
  @IsString({ message: 'CLIENT_URL doit être une chaîne' })
  CLIENT_URL?: string;

  @IsOptional()
  @Matches(/^(true|false)$/i, {
    message: "EXPOSE_OTP doit valoir 'true' ou 'false'",
  })
  EXPOSE_OTP?: string;
}

/**
 * Échoue au démarrage si une variable critique est absente ou invalide,
 * plutôt que de laisser l'application démarrer dans un état incohérent.
 */
export function validerEnvironnement(
  configuration: Record<string, unknown>,
): Record<string, unknown> {
  const variables = plainToInstance(VariablesEnvironnement, configuration, {
    enableImplicitConversion: true,
  });

  const erreurs = validateSync(variables, { skipMissingProperties: false });

  if (erreurs.length > 0) {
    const details = erreurs
      .map((erreur) => {
        const contraintes = Object.values(erreur.constraints ?? {}).join(', ');
        return `- ${erreur.property} : ${contraintes || 'valeur invalide'}`;
      })
      .join('\n');

    throw new Error(`Variables d'environnement invalides :\n${details}`);
  }

  return configuration;
}
