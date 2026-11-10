import {
  IsDateString,
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

export class CreerLoyerDto {
  @IsString({ message: 'Le locataire est obligatoire' })
  @IsNotEmpty({ message: 'Le locataire est obligatoire' })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId!: string;

  @IsOptional()
  @IsInt({ message: 'Le montant dû doit être un nombre entier' })
  @Min(1, { message: 'Le montant dû doit être supérieur à zéro' })
  montantDu?: number;

  @IsString({ message: 'Le mois est obligatoire' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Le mois doit être au format AAAA-MM' })
  mois!: string;

  @IsOptional()
  @IsDateString({}, { message: "La date d'échéance est invalide" })
  dateEcheance?: string;

  @IsOptional()
  @IsInt({ message: 'Le montant reçu doit être un nombre entier' })
  @Min(0, { message: 'Le montant reçu ne peut pas être négatif' })
  montantRecu?: number;

  @IsOptional()
  @IsIn([...MODES_PAIEMENT], { message: 'Mode de paiement invalide' })
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsDateString({}, { message: 'La date de paiement est invalide' })
  datePaiement?: string;
}

export class PayerLoyerDto {
  @IsInt({ message: 'Le montant encaissé doit être un nombre entier' })
  @Min(1, { message: 'Le montant encaissé doit être supérieur à zéro' })
  montantRecu!: number;

  @IsOptional()
  @IsIn([...MODES_PAIEMENT], { message: 'Mode de paiement invalide' })
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsDateString({}, { message: 'La date de paiement est invalide' })
  datePaiement?: string;
}

export class GenererLoyersDto {
  @IsString({ message: 'Le mois est obligatoire' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Le mois doit être au format AAAA-MM' })
  mois!: string;
}
