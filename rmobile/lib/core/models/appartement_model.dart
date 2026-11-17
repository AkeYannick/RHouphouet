import 'package:rmobile/core/utils/format.dart';

/// Appartement tel que renvoyé par l'API (espace locataire).
class AppartementModel {
  final String id;
  final String numero;
  final String? designation;
  final int loyerMensuel;
  final int nombrePieces;
  final String statut;

  const AppartementModel({
    required this.id,
    required this.numero,
    required this.designation,
    required this.loyerMensuel,
    required this.nombrePieces,
    required this.statut,
  });

  factory AppartementModel.fromJson(Map<String, dynamic> json) {
    return AppartementModel(
      id: json['id']?.toString() ?? '',
      numero: json['numero']?.toString() ?? '',
      designation: json['designation']?.toString(),
      loyerMensuel: entierDepuisJson(json['loyerMensuel']),
      nombrePieces: entierDepuisJson(json['nombrePieces']),
      statut: json['statut']?.toString() ?? 'LIBRE',
    );
  }

  String get libelle {
    final details = designation?.trim();
    if (details != null && details.isNotEmpty) {
      return 'Appartement $numero · $details';
    }
    return 'Appartement $numero';
  }
}
