import 'package:rmobile/core/utils/format.dart';

/// Loyer d'un mois donné, tel que renvoyé par l'API.
class LoyerModel {
  final String id;
  final String mois;
  final int montantDu;
  final int montantRecu;
  final DateTime? dateEcheance;
  final DateTime? datePaiement;
  final String modePaiement;
  final String statut;

  const LoyerModel({
    required this.id,
    required this.mois,
    required this.montantDu,
    required this.montantRecu,
    required this.dateEcheance,
    required this.datePaiement,
    required this.modePaiement,
    required this.statut,
  });

  factory LoyerModel.fromJson(Map<String, dynamic> json) {
    return LoyerModel(
      id: json['id']?.toString() ?? '',
      mois: json['mois']?.toString() ?? '',
      montantDu: entierDepuisJson(json['montantDu']),
      montantRecu: entierDepuisJson(json['montantRecu']),
      dateEcheance: dateDepuisJson(json['dateEcheance']),
      datePaiement: dateDepuisJson(json['datePaiement']),
      modePaiement: json['modePaiement']?.toString() ?? 'ESPECES',
      statut: json['statut']?.toString() ?? 'EN_ATTENTE',
    );
  }

  int get reste => (montantDu - montantRecu).clamp(0, montantDu);

  double get progression {
    if (montantDu <= 0) {
      return 0;
    }
    return (montantRecu / montantDu).clamp(0, 1).toDouble();
  }

  bool get estSolde => reste == 0;

  String get moisLisible => formaterMois(mois);
}
