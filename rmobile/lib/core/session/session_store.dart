import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Persiste le jeton et le profil du locataire entre deux ouvertures de l'app.
class SessionStore {
  static const FlutterSecureStorage _stockage = FlutterSecureStorage();

  static const String _cleJeton = 'rh_locataire_jeton';
  static const String _cleLocataire = 'rh_locataire';

  static Future<void> enregistrer({
    required String jeton,
    required Map<String, dynamic> locataire,
  }) async {
    await _stockage.write(key: _cleJeton, value: jeton);
    await _stockage.write(key: _cleLocataire, value: jsonEncode(locataire));
  }

  static Future<String?> lireJeton() async {
    return _stockage.read(key: _cleJeton);
  }

  static Future<Map<String, dynamic>?> lireLocataire() async {
    final brut = await _stockage.read(key: _cleLocataire);
    if (brut == null || brut.isEmpty) {
      return null;
    }

    try {
      final decode = jsonDecode(brut);
      return decode is Map<String, dynamic> ? decode : null;
    } catch (_) {
      return null;
    }
  }

  static Future<bool> aUneSession() async {
    final jeton = await lireJeton();
    return jeton != null && jeton.isNotEmpty;
  }

  static Future<void> effacer() async {
    await _stockage.delete(key: _cleJeton);
    await _stockage.delete(key: _cleLocataire);
  }
}
