import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';

Color couleurStatutLoyer(String statut) {
  switch (statut) {
    case 'PAYE':
      return const Color(0xFF16A34A);
    case 'PARTIEL':
      return const Color(0xFFD97706);
    case 'EN_RETARD':
      return const Color(0xFFDC2626);
    default:
      return AppColors.bleuBouton;
  }
}

Color couleurStatutContrat(String statut) {
  switch (statut) {
    case 'ACTIF':
      return const Color(0xFF4ADE80);
    case 'TERMINE':
      return const Color(0xFFCBD5E1);
    default:
      return const Color(0xFFFCA5A5);
  }
}
