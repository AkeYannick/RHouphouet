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
import { CATEGORIES_CHARGE, type CategorieCharge } from '../../../common/enums';

export class CreerChargeDto {
  @IsString({ message: 'Le libellé doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le libellé est obligatoire' })
  @MaxLength(150, { message: 'Le libellé ne peut pas dépasser 150 caractères' })
  libelle!: string;

  @IsOptional()
  @IsIn([...CATEGORIES_CHARGE], { message: 'Catégorie de charge invalide' })
  categorie?: CategorieCharge;

  @IsInt({ message: 'Le montant doit être un nombre entier' })
  @Min(1, { message: 'Le montant doit être supérieur à zéro' })
  montant!: number;

  @IsDateString({}, { message: 'La date de la charge est invalide' })
  date!: string;

  @IsOptional()
  @IsString({ message: "L'identifiant de l'appartement est invalide" })
  @MaxLength(40, { message: "L'identifiant de l'appartement est invalide" })
  appartementId?: string;
}
