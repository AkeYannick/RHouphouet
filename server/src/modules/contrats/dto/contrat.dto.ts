import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { STATUTS_CONTRAT, type StatutContrat } from '../../../common/enums';

export class CreerContratDto {
  @IsString({ message: 'Le locataire est obligatoire' })
  @IsNotEmpty({ message: 'Le locataire est obligatoire' })
  @MaxLength(40, { message: "L'identifiant du locataire est invalide" })
  locataireId!: string;

  @IsOptional()
  @IsString({ message: "L'identifiant de l'appartement est invalide" })
  @MaxLength(40, { message: "L'identifiant de l'appartement est invalide" })
  appartementId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateDebut?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin est invalide' })
  dateFin?: string;

  @IsOptional()
  @IsInt({ message: 'Le loyer mensuel doit être un nombre entier' })
  @Min(1, { message: 'Le loyer mensuel doit être supérieur à zéro' })
  loyerMensuel?: number;

  @IsOptional()
  @IsInt({ message: 'La caution doit être un nombre entier' })
  @Min(0, { message: 'La caution ne peut pas être négative' })
  caution?: number;

  @IsOptional()
  @IsInt({ message: 'Les charges mensuelles doivent être un nombre entier' })
  @Min(0, { message: 'Les charges mensuelles ne peuvent pas être négatives' })
  chargesMensuelles?: number;

  @IsOptional()
  @IsIn([...STATUTS_CONTRAT], { message: 'Statut de contrat invalide' })
  statut?: StatutContrat;

  @IsOptional()
  @IsString({ message: 'Les clauses sont invalides' })
  @MaxLength(4000, { message: 'Les clauses ne peuvent pas dépasser 4000 caractères' })
  clauses?: string;
}

export class ModifierContratDto {
  @IsOptional()
  @IsString({ message: "L'identifiant de l'appartement est invalide" })
  @MaxLength(40, { message: "L'identifiant de l'appartement est invalide" })
  appartementId?: string | null;

  @IsOptional()
  @IsDateString({}, { message: 'La date de début est invalide' })
  dateDebut?: string;

  @IsOptional()
  @IsDateString({}, { message: 'La date de fin est invalide' })
  dateFin?: string | null;

  @IsOptional()
  @IsInt({ message: 'Le loyer mensuel doit être un nombre entier' })
  @Min(1, { message: 'Le loyer mensuel doit être supérieur à zéro' })
  loyerMensuel?: number;

  @IsOptional()
  @IsInt({ message: 'La caution doit être un nombre entier' })
  @Min(0, { message: 'La caution ne peut pas être négative' })
  caution?: number;

  @IsOptional()
  @IsInt({ message: 'Les charges mensuelles doivent être un nombre entier' })
  @Min(0, { message: 'Les charges mensuelles ne peuvent pas être négatives' })
  chargesMensuelles?: number;

  @IsOptional()
  @IsIn([...STATUTS_CONTRAT], { message: 'Statut de contrat invalide' })
  statut?: StatutContrat;

  @IsOptional()
  @IsString({ message: 'Les clauses sont invalides' })
  @MaxLength(4000, { message: 'Les clauses ne peuvent pas dépasser 4000 caractères' })
  clauses?: string;
}
