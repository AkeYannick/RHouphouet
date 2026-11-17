import 'package:rmobile/core/models/appartement_model.dart';
import 'package:rmobile/core/utils/format.dart';

/// Locataire connecté, tel que renvoyé par l'API.
class LocataireModel {
  final String id;
  final String nom;
  final String telephone;
  final String? email;
  final int loyerMensuel;
  final int caution;
  final DateTime? dateEntree;
  final AppartementModel? appartement;

  const LocataireModel({
    required this.id,
    required this.nom,
    required this.telephone,
    required this.email,
    required this.loyerMensuel,
    required this.caution,
    required this.dateEntree,
    required this.appartement,
  });

  factory LocataireModel.fromJson(Map<String, dynamic> json) {
    final appartement = json['appartement'];

    return LocataireModel(
      id: json['id']?.toString() ?? '',
      nom: json['nom']?.toString() ?? '',
      telephone: json['telephone']?.toString() ?? '',
      email: json['email']?.toString(),
      loyerMensuel: entierDepuisJson(json['loyerMensuel']),
      caution: entierDepuisJson(json['caution']),
      dateEntree: dateDepuisJson(json['dateEntree']),
      appartement: appartement is Map
          ? AppartementModel.fromJson(Map<String, dynamic>.from(appartement))
          : null,
    );
  }

  String get nomComplet => nom;

  String get prenom {
    final morceaux = nom.trim().split(RegExp(r'\s+'));
    return morceaux.isEmpty ? '' : morceaux.first;
  }

  String get logement => appartement?.libelle ?? 'Logement non renseigné';

  String get anciennete => ancienneteDepuis(dateEntree);

  /// Extrait les initiales (ex: "Maya Bernard" -> "MB")
  String get initiales {
    final morceaux = nom.trim().split(RegExp(r'\s+'));
    if (morceaux.length >= 2) {
      return '${morceaux[0][0]}${morceaux[1][0]}'.toUpperCase();
    }
    return nom.isNotEmpty ? nom[0].toUpperCase() : 'L';
  }
}
