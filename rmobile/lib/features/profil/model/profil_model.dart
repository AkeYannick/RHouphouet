class ProfilModel {
  final String nomComplet;
  final String telephone;
  final String anciennete;

  const ProfilModel({
    required this.nomComplet,
    required this.telephone,
    required this.anciennete,
  });

  /// Extrait les initiales (ex: "Maya Bernard" -> "MB")
  String get initiales {
    final parts = nomComplet.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return "${parts[0][0]}${parts[1][0]}".toUpperCase();
    }
    return nomComplet.isNotEmpty ? nomComplet[0].toUpperCase() : "L";
  }
}
