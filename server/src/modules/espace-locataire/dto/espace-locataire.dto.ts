import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import { MODES_PAIEMENT, type ModePaiement } from '../../../common/enums';

export class ConnexionLocataireDto {
  @IsString({ message: 'Le numéro de téléphone est obligatoire' })
  @IsNotEmpty({ message: 'Le numéro de téléphone est obligatoire' })
  @MaxLength(30, { message: 'Le numéro de téléphone est invalide' })
  telephone!: string;
}

export class VerifierCodeLocataireDto extends ConnexionLocataireDto {
  @IsString({ message: 'Le code est obligatoire' })
  @Matches(/^\d{6}$/, { message: 'Le code doit contenir 6 chiffres' })
  code!: string;
}

export class PaiementLocataireDto {
  @IsString({ message: 'Le mois est obligatoire' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Le mois doit être au format AAAA-MM' })
  mois!: string;

  @IsInt({ message: 'Le montant doit être un nombre entier' })
  @Min(1, { message: 'Le montant doit être supérieur à zéro' })
  montant!: number;

  @IsOptional()
  @IsIn([...MODES_PAIEMENT], { message: 'Mode de paiement invalide' })
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsString({ message: 'La note est invalide' })
  @MaxLength(200, { message: 'La note ne peut pas dépasser 200 caractères' })
  note?: string;
}

export class MessageLocataireDto {
  @IsString({ message: 'Le message est obligatoire' })
  @IsNotEmpty({ message: 'Le message ne peut pas être vide' })
  @MaxLength(2000, { message: 'Le message ne peut pas dépasser 2000 caractères' })
  contenu!: string;
}
