import 'package:rmobile/core/utils/format.dart';

/// Message échangé entre le locataire et l'administration.
class MessageModel {
  final String id;
  final String contenu;
  final String expediteur;
  final DateTime? creeLe;
  final bool lu;

  const MessageModel({
    required this.id,
    required this.contenu,
    required this.expediteur,
    required this.creeLe,
    required this.lu,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id']?.toString() ?? '',
      contenu: json['contenu']?.toString() ?? '',
      expediteur: json['expediteur']?.toString() ?? 'ADMIN',
      creeLe: dateDepuisJson(json['creeLe']),
      lu: json['lu'] == true,
    );
  }

  bool get estLocataire => expediteur == 'LOCATAIRE';
}
