import 'package:flutter/foundation.dart';

/// Configuration de l'accès à l'API selon la plateforme.
///
/// Surcharge possible au lancement :
/// `flutter run --dart-define=API_BASE_URL=http://192.168.1.20:5000/api`
class AppConfig {
  static const String _urlPersonnalisee = String.fromEnvironment(
    'API_BASE_URL',
  );

  static String get urlApi {
    if (_urlPersonnalisee.isNotEmpty) {
      return _urlPersonnalisee;
    }

    if (kIsWeb) {
      return 'http://localhost:5000/api';
    }

    // L'émulateur Android accède à la machine hôte via 10.0.2.2
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:5000/api';
    }

    return 'http://localhost:5000/api';
  }
}
