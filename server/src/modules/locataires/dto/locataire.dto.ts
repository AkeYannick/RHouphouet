import { PartialType } from '@nestjs/mapped-types';
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreerLocataireDto {
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le nom complet est obligatoire' })
  @MaxLength(120, { message: 'Le nom ne peut pas dépasser 120 caractères' })
  nom!: string;

  @IsString({ message: 'Le téléphone doit être une chaîne de caractères' })
  @Matches(/^\+?[0-9\s().-]{8,25}$/, {
    message: 'Le numéro de téléphone est invalide (exemple : +225 07 08 09 10 11)',
  })
  @MaxLength(25, { message: 'Le numéro de téléphone est trop long' })
  telephone!: string;

  @IsOptional()
  @IsEmail({}, { message: "L'adresse e-mail est invalide" })
  @MaxLength(254, { message: "L'adresse e-mail est trop longue" })
  email?: string;

  @IsOptional()
  @IsString({ message: "L'identifiant de l'appartement est invalide" })
  @MaxLength(40, { message: "L'identifiant de l'appartement est invalide" })
  appartementId?: string;

  @IsOptional()
  @IsInt({ message: 'Le loyer mensuel doit être un nombre entier' })
  @Min(0, { message: 'Le loyer mensuel ne peut pas être négatif' })
  loyerMensuel?: number;

  @IsOptional()
  @IsInt({ message: 'La caution doit être un nombre entier' })
  @Min(0, { message: 'La caution ne peut pas être négative' })
  caution?: number;

  @IsDateString({}, { message: "La date d'entrée est invalide" })
  dateEntree!: string;
}

export class ModifierLocataireDto extends PartialType(CreerLocataireDto) {}
