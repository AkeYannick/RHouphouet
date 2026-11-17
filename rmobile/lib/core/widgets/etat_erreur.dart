import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';

/// Message d'erreur avec bouton de nouvelle tentative.
class EtatErreur extends StatelessWidget {
  final String message;
  final VoidCallback onReessayer;
  final Widget? action;

  const EtatErreur({
    super.key,
    required this.message,
    required this.onReessayer,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7F7),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF6C9C9)),
      ),
      child: Column(
        children: [
          const Icon(
            Icons.wifi_off_rounded,
            color: Color(0xFFDC2626),
            size: 26,
          ),
          const SizedBox(height: 10),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF7F1D1D),
              fontSize: 13,
              height: 1.4,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 10,
            runSpacing: 8,
            alignment: WrapAlignment.center,
            children: [
              OutlinedButton(
                onPressed: onReessayer,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.bleuprofond,
                  side: BorderSide(color: Colors.grey.shade300),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text('Réessayer'),
              ),
              ?action,
            ],
          ),
        ],
      ),
    );
  }
}
