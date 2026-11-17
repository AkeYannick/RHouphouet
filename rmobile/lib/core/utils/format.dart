const List<String> _moisLongs = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
];

const List<String> _moisCourts = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

String formaterMontant(int montant) {
  final chiffres = montant.abs().toString();
  final buffer = StringBuffer();

  for (var i = 0; i < chiffres.length; i++) {
    if (i > 0 && (chiffres.length - i) % 3 == 0) {
      buffer.write(' ');
    }
    buffer.write(chiffres[i]);
  }

  return '${montant < 0 ? '-' : ''}${buffer.toString()} FCFA';
}

DateTime? dateDepuisJson(dynamic valeur) {
  if (valeur is! String || valeur.isEmpty) {
    return null;
  }
  return DateTime.tryParse(valeur)?.toLocal();
}

int entierDepuisJson(dynamic valeur) {
  if (valeur is num) {
    return valeur.toInt();
  }
  return int.tryParse('${valeur ?? ''}') ?? 0;
}

String formaterMois(String mois) {
  final parties = mois.split('-');
  if (parties.length != 2) {
    return mois;
  }

  final numero = int.tryParse(parties[1]);
  if (numero == null || numero < 1 || numero > 12) {
    return mois;
  }

  return '${_moisLongs[numero - 1]} ${parties[0]}';
}

String formaterMoisCourt(String mois) {
  final parties = mois.split('-');
  if (parties.length != 2) {
    return mois;
  }

  final numero = int.tryParse(parties[1]);
  if (numero == null || numero < 1 || numero > 12) {
    return mois;
  }

  return '${_moisCourts[numero - 1]} ${parties[0].substring(2)}';
}

String formaterDate(DateTime? date) {
  if (date == null) {
    return '—';
  }
  return '${date.day} ${_moisCourts[date.month - 1]} ${date.year}';
}

String formaterDateHeure(DateTime? date) {
  if (date == null) {
    return '—';
  }
  final heures = date.hour.toString().padLeft(2, '0');
  final minutes = date.minute.toString().padLeft(2, '0');
  return '${formaterDate(date)} · $heures:$minutes';
}

String moisCourant() {
  final maintenant = DateTime.now();
  return '${maintenant.year}-${maintenant.month.toString().padLeft(2, '0')}';
}

String ancienneteDepuis(DateTime? dateEntree) {
  if (dateEntree == null) {
    return 'Locataire';
  }

  final maintenant = DateTime.now();
  final moisEcoules =
      (maintenant.year - dateEntree.year) * 12 +
      maintenant.month -
      dateEntree.month;

  if (moisEcoules < 1) {
    return 'Locataire depuis ce mois';
  }

  if (moisEcoules < 12) {
    return 'Locataire depuis $moisEcoules mois';
  }

  final annees = moisEcoules ~/ 12;
  final reste = moisEcoules % 12;

  if (reste == 0) {
    return 'Locataire depuis $annees an${annees > 1 ? 's' : ''}';
  }

  return 'Locataire depuis $annees an${annees > 1 ? 's' : ''} et $reste mois';
}

String libelleModePaiement(String mode) {
  switch (mode) {
    case 'ESPECES':
      return 'Espèces';
    case 'VIREMENT':
      return 'Virement';
    case 'MOBILE_MONEY':
      return 'Mobile Money';
    case 'CARTE':
      return 'Carte bancaire';
    default:
      return mode;
  }
}

String libelleStatutLoyer(String statut) {
  switch (statut) {
    case 'EN_ATTENTE':
      return 'En attente';
    case 'PARTIEL':
      return 'Partiel';
    case 'PAYE':
      return 'Payé';
    case 'EN_RETARD':
      return 'En retard';
    default:
      return statut;
  }
}

String libelleStatutContrat(String statut) {
  switch (statut) {
    case 'ACTIF':
      return 'Actif';
    case 'TERMINE':
      return 'Terminé';
    case 'RESILIE':
      return 'Résilié';
    default:
      return statut;
  }
}
