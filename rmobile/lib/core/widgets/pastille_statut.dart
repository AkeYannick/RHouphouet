import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';

/// Petite pastille colorée pour afficher un statut.
class PastilleStatut extends StatelessWidget {
  final String libelle;
  final Color couleur;

  const PastilleStatut({
    super.key,
    required this.libelle,
    required this.couleur,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: couleur.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        libelle,
        style: TextStyle(
          color: couleur,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.2,
        ),
      ),
    );
  }
}

/// Barre de progression arrondie réutilisable (loyers, cautions...).
class BarreProgression extends StatelessWidget {
  final double valeur;
  final Color couleur;
  final Color fond;

  const BarreProgression({
    super.key,
    required this.valeur,
    this.couleur = AppColors.bleuBouton,
    this.fond = const Color(0x33FFFFFF),
  });

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: LinearProgressIndicator(
        value: valeur.clamp(0, 1).toDouble(),
        minHeight: 8,
        color: couleur,
        backgroundColor: fond,
      ),
    );
  }
}
