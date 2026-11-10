import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  STATUTS_APPARTEMENT,
  type StatutAppartement,
} from '../../../common/enums';

export class CreerAppartementDto {
  @IsString({ message: 'Le numéro doit être une chaîne de caractères' })
  @IsNotEmpty({ message: "Le numéro de l'appartement est obligatoire" })
  @MaxLength(30, { message: 'Le numéro ne peut pas dépasser 30 caractères' })
  numero!: string;

  @IsOptional()
  @IsString({ message: 'La désignation doit être une chaîne de caractères' })
  @MaxLength(150, { message: 'La désignation ne peut pas dépasser 150 caractères' })
  designation?: string;

  @IsInt({ message: 'Le loyer mensuel doit être un nombre entier' })
  @Min(0, { message: 'Le loyer mensuel ne peut pas être négatif' })
  loyerMensuel!: number;

  @IsOptional()
  @IsInt({ message: 'Le nombre de pièces doit être un nombre entier' })
  @Min(1, { message: 'Un appartement doit avoir au moins une pièce' })
  nombrePieces?: number;

  @IsOptional()
  @IsIn([...STATUTS_APPARTEMENT], { message: "Statut d'appartement invalide" })
  statut?: StatutAppartement;
}

export class ModifierAppartementDto {
  @IsOptional()
  @IsString({ message: 'Le numéro doit être une chaîne de caractères' })
  @IsNotEmpty({ message: "Le numéro de l'appartement est obligatoire" })
  @MaxLength(30, { message: 'Le numéro ne peut pas dépasser 30 caractères' })
  numero?: string;

  @IsOptional()
  @IsString({ message: 'La désignation doit être une chaîne de caractères' })
  @MaxLength(150, { message: 'La désignation ne peut pas dépasser 150 caractères' })
  designation?: string;

  @IsOptional()
  @IsInt({ message: 'Le loyer mensuel doit être un nombre entier' })
  @Min(0, { message: 'Le loyer mensuel ne peut pas être négatif' })
  loyerMensuel?: number;

  @IsOptional()
  @IsInt({ message: 'Le nombre de pièces doit être un nombre entier' })
  @Min(1, { message: 'Un appartement doit avoir au moins une pièce' })
  nombrePieces?: number;

  @IsOptional()
  @IsIn([...STATUTS_APPARTEMENT], { message: "Statut d'appartement invalide" })
  statut?: StatutAppartement;
}
