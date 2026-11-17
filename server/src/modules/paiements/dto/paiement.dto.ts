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

export class CreerPaiementDto {
  @IsString({ message: 'Le locataire est obligatoire' })
  @IsNotEmpty({ message: 'Le locataire est obligatoire' })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId!: string;

  @IsString({ message: 'Le mois est obligatoire' })
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/, { message: 'Le mois doit être au format AAAA-MM' })
  mois!: string;

  @IsInt({ message: 'Le montant doit être un nombre entier' })
  @Min(1, { message: 'Le montant doit être supérieur à zéro' })
  montant!: number;

  @IsOptional()
  @IsInt({ message: 'Le montant dû doit être un nombre entier' })
  @Min(1, { message: 'Le montant dû doit être supérieur à zéro' })
  montantDu?: number;

  @IsOptional()
  @IsIn([...MODES_PAIEMENT], { message: 'Mode de paiement invalide' })
  modePaiement?: ModePaiement;

  @IsOptional()
  @IsDateString({}, { message: 'La date de paiement est invalide' })
  datePaiement?: string;

  @IsOptional()
  @IsString({ message: 'La note est invalide' })
  @MaxLength(200, { message: 'La note ne peut pas dépasser 200 caractères' })
  note?: string;
}

/** Données d'un encaissement sur un loyer existant (partagées avec le module loyers) */
export interface EncaissementLoyerDto {
  montantRecu: number;
  modePaiement?: ModePaiement;
  datePaiement?: Date | string;
  note?: string;
}
