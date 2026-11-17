import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';

/// État vide illustré (aucun paiement, aucun loyer...).
class EtatVide extends StatelessWidget {
  final IconData icone;
  final String titre;
  final String? description;

  const EtatVide({
    super.key,
    required this.icone,
    required this.titre,
    this.description,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      decoration: BoxDecoration(
        color: AppColors.blanc,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFEDF1FC),
              borderRadius: BorderRadius.circular(18),
            ),
            child: Icon(icone, color: AppColors.bleuBouton, size: 26),
          ),
          const SizedBox(height: 14),
          Text(
            titre,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.bleuprofond,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          if (description != null) ...[
            const SizedBox(height: 6),
            Text(
              description!,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 13,
                height: 1.4,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
