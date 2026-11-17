import 'package:dio/dio.dart';
import 'package:rmobile/core/config/app_config.dart';
import 'package:rmobile/core/session/session_store.dart';

class ApiException implements Exception {
  final String message;
  final int statut;

  const ApiException(this.message, {this.statut = 0});

  bool get sessionExpiree => statut == 401;

  @override
  String toString() => message;
}

/// Client HTTP unique de l'espace locataire.
/// Le jeton de session est ajouté automatiquement à chaque requête.
class ApiClient {
  ApiClient({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              baseUrl: AppConfig.urlApi,
              connectTimeout: const Duration(seconds: 12),
              receiveTimeout: const Duration(seconds: 20),
              headers: const {'Content-Type': 'application/json'},
            ),
          ) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final jeton = await SessionStore.lireJeton();
          if (jeton != null && jeton.isNotEmpty) {
            options.headers['Authorization'] = 'Bearer $jeton';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;

  Future<dynamic> get(String chemin, {Map<String, dynamic>? parametres}) {
    return _executer(() => _dio.get(chemin, queryParameters: parametres));
  }

  Future<dynamic> post(String chemin, {Object? donnees}) {
    return _executer(() => _dio.post(chemin, data: donnees));
  }

  Future<dynamic> patch(String chemin, {Object? donnees}) {
    return _executer(() => _dio.patch(chemin, data: donnees));
  }

  Future<dynamic> delete(String chemin) {
    return _executer(() => _dio.delete(chemin));
  }

  Future<dynamic> _executer(Future<Response<dynamic>> Function() action) async {
    try {
      final reponse = await action();
      return reponse.data;
    } on DioException catch (erreur) {
      throw ApiException(
        _messageErreur(erreur),
        statut: erreur.response?.statusCode ?? 0,
      );
    }
  }

  String _messageErreur(DioException erreur) {
    final donnees = erreur.response?.data;

    if (donnees is Map) {
      final message = donnees['message'];
      if (message is String && message.isNotEmpty) {
        return message;
      }
      if (message is List && message.isNotEmpty) {
        return message.join(' · ');
      }
    }

    if (donnees is String && donnees.isNotEmpty) {
      return donnees;
    }

    if (erreur.type == DioExceptionType.connectionTimeout ||
        erreur.type == DioExceptionType.receiveTimeout ||
        erreur.type == DioExceptionType.connectionError) {
      return 'Le service est momentanément indisponible. Vérifiez votre connexion.';
    }

    final statut = erreur.response?.statusCode;
    if (statut != null && statut >= 500) {
      return 'Le service est momentanément indisponible. Réessayez dans un instant.';
    }

    return 'La demande n’a pas pu aboutir. Veuillez réessayer.';
  }
}
