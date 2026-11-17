import 'package:rmobile/core/utils/format.dart';

/// Versement enregistré au titre d'un loyer.
class PaiementModel {
  final String id;
  final String reference;
  final int montant;
  final DateTime? datePaiement;
  final String modePaiement;
  final String? note;
  final String? mois;

  const PaiementModel({
    required this.id,
    required this.reference,
    required this.montant,
    required this.datePaiement,
    required this.modePaiement,
    required this.note,
    required this.mois,
  });

  factory PaiementModel.fromJson(Map<String, dynamic> json) {
    final loyer = json['loyer'];

    return PaiementModel(
      id: json['id']?.toString() ?? '',
      reference: json['reference']?.toString() ?? '',
      montant: entierDepuisJson(json['montant']),
      datePaiement: dateDepuisJson(json['datePaiement']),
      modePaiement: json['modePaiement']?.toString() ?? 'ESPECES',
      note: json['note']?.toString(),
      mois: loyer is Map ? loyer['mois']?.toString() : null,
    );
  }
}
