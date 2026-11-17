import 'package:rmobile/core/models/appartement_model.dart';
import 'package:rmobile/core/utils/format.dart';

/// Contrat de location actif du locataire.
class ContratModel {
  final String id;
  final String numero;
  final String statut;
  final DateTime? dateDebut;
  final DateTime? dateFin;
  final int loyerMensuel;
  final int caution;
  final int chargesMensuelles;
  final String? clauses;
  final String? nomLocataire;
  final AppartementModel? appartement;

  const ContratModel({
    required this.id,
    required this.numero,
    required this.statut,
    required this.dateDebut,
    required this.dateFin,
    required this.loyerMensuel,
    required this.caution,
    required this.chargesMensuelles,
    required this.clauses,
    required this.nomLocataire,
    required this.appartement,
  });

  factory ContratModel.fromJson(Map<String, dynamic> json) {
    final appartement = json['appartement'];
    final locataire = json['locataire'];

    return ContratModel(
      id: json['id']?.toString() ?? '',
      numero: json['numero']?.toString() ?? '',
      statut: json['statut']?.toString() ?? 'ACTIF',
      dateDebut: dateDepuisJson(json['dateDebut']),
      dateFin: dateDepuisJson(json['dateFin']),
      loyerMensuel: entierDepuisJson(json['loyerMensuel']),
      caution: entierDepuisJson(json['caution']),
      chargesMensuelles: entierDepuisJson(json['chargesMensuelles']),
      clauses: json['clauses']?.toString(),
      nomLocataire: locataire is Map ? locataire['nom']?.toString() : null,
      appartement: appartement is Map
          ? AppartementModel.fromJson(Map<String, dynamic>.from(appartement))
          : null,
    );
  }

  int get totalMensuel => loyerMensuel + chargesMensuelles;
}
