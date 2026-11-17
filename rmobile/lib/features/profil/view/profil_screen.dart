import 'package:flutter/material.dart';
import 'package:rmobile/core/themes/app_colors.dart';
import 'package:rmobile/core/widgets/etat_erreur.dart';
import 'package:rmobile/features/auth/view/login_screen.dart';
import 'package:rmobile/features/profil/viewmodel/profil_viewmodel.dart';

class ProfilScreen extends StatefulWidget {
  const ProfilScreen({super.key});

  @override
  State<ProfilScreen> createState() => _ProfilScreenState();
}

class _ProfilScreenState extends State<ProfilScreen> {
  final ProfilViewModel _viewModel = ProfilViewModel();

  @override
  void dispose() {
    _viewModel.dispose();
    super.dispose();
  }

  void _confirmerDeconnexion() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.blanc,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text(
          "Se déconnecter ?",
          style: TextStyle(
            color: AppColors.bleuprofond,
            fontWeight: FontWeight.w800,
          ),
        ),
        content: Text(
          "Vous devrez recevoir un nouveau code SMS pour vous reconnecter à votre espace.",
          style: TextStyle(color: Colors.grey.shade600, fontSize: 14),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: Text(
              "Annuler",
              style: TextStyle(color: Colors.grey.shade600),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade600,
              foregroundColor: AppColors.blanc,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
            onPressed: () async {
              Navigator.of(ctx).pop();
              await _viewModel.seDeconnecter();
              if (!mounted) return;
              Navigator.of(context).pushAndRemoveUntil(
                MaterialPageRoute(builder: (_) => const LoginScreen()),
                (route) => false,
              );
            },
            child: const Text("Déconnexion"),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _viewModel,
      builder: (context, child) {
        return Scaffold(
          backgroundColor: const Color(0xFFFAFAFC),
          appBar: AppBar(
            backgroundColor: AppColors.blanc,
            surfaceTintColor: Colors.transparent,
            elevation: 0.5,
            shadowColor: Colors.grey.shade200,
            centerTitle: true,
            leadingWidth: 115,
            leading: Padding(
              padding: const EdgeInsets.only(left: 16, top: 8, bottom: 8),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.bleuprofond,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Image.asset(
                  "assets/Logo/logoRH.png",
                  fit: BoxFit.contain,
                ),
              ),
            ),
            title: Text(
              "Profil",
              style: TextStyle(
                color: AppColors.bleuprofond,
                fontSize: 20,
                fontWeight: FontWeight.w800,
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: InkWell(
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        behavior: SnackBarBehavior.floating,
                        content: Text('Vous êtes à jour, aucune alerte.'),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(22),
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                      color: Color(0xFFF3F4F6),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.notifications_none_rounded,
                      color: AppColors.bleuprofond,
                      size: 22,
                    ),
                  ),
                ),
              ),
            ],
          ),
          body: _viewModel.isLoading
              ? Center(
                  child: CircularProgressIndicator(color: AppColors.bleuBouton),
                )
              : _viewModel.locataire == null
                  ? ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        EtatErreur(
                          message: _viewModel.errorMessage ??
                              'Impossible de charger votre profil.',
                          onReessayer: _viewModel.chargerProfil,
                        ),
                      ],
                    )
                  : SingleChildScrollView(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 24,
                  ),
                  child: Column(
                    children: [
                      // Avatar carré arrondi avec badge "+"
                      Stack(
                        clipBehavior: Clip.none,
                        children: [
                          Container(
                            width: 86,
                            height: 86,
                            decoration: BoxDecoration(
                              color: AppColors.bleuprofond,
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Center(
                              child: Text(
                                _viewModel.initiales,
                                style: const TextStyle(
                                  color: Color(0xFF60A5FA),
                                  fontSize: 28,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                          Positioned(
                            bottom: -4,
                            right: -4,
                            child: GestureDetector(
                              onTap: () {
                                // TODO: Modifier la photo de profil
                              },
                              child: Container(
                                width: 28,
                                height: 28,
                                decoration: BoxDecoration(
                                  color: AppColors.bleuBouton,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: AppColors.blanc,
                                    width: 2.5,
                                  ),
                                ),
                                child: const Icon(
                                  Icons.add,
                                  color: AppColors.blanc,
                                  size: 16,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 16),

                      // Nom complet
                      Text(
                        _viewModel.nomComplet,
                        style: TextStyle(
                          color: AppColors.bleuprofond,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                        ),
                      ),

                      const SizedBox(height: 4),

                      // Numéro de téléphone
                      Text(
                        _viewModel.telephone,
                        style: TextStyle(
                          color: Colors.grey.shade600,
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Pilule d'ancienneté
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEDF1FC),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          _viewModel.anciennete,
                          style: TextStyle(
                            color: AppColors.bleuBouton,
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),

                      const SizedBox(height: 28),

                      // Carte regroupant les 4 menus
                      Container(
                        decoration: BoxDecoration(
                          color: AppColors.blanc,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Colors.grey.shade200,
                            width: 1,
                          ),
                        ),
                        child: Column(
children: [
_buildMenuTile(
icon: Icons.settings_outlined,
title: "Paramètres",
subtitle: "Préférences de l'application",
onTap: () {
// TODO: Naviguer vers Paramètres
},
),
_buildDivider(),
_buildMenuTile(
icon: Icons.lock_outline_rounded,
title: "Sécurité",
subtitle: "Téléphone et biométrie",
onTap: () {
  // TODO: Naviguer vers Sécurité
},
),
_buildDivider(),
_buildMenuTile(
icon: Icons.help_outline_rounded,
title: "Aide & support",
subtitle: "FAQ et contact",
onTap: () {
// TODO: Naviguer vers Aide & support
},
),
_buildDivider(),
_buildMenuTile(
icon: Icons.description_outlined,
title: "Confidentialité & CGU",
subtitle: "Vos droits et nos engagements",
onTap: () {
// TODO: Naviguer vers Confidentialité & CGU
},
),
],
),
),
const SizedBox(height: 24),
// Bouton "Se déconnecter" rouge pâle
SizedBox(
width: double.infinity,
height: 52,
child: TextButton.icon(
style: TextButton.styleFrom(
backgroundColor: const Color(0xFFFDF2F2),
foregroundColor: const Color(0xFFDC2626),
shape: RoundedRectangleBorder(
borderRadius: BorderRadius.circular(16),
),
),
onPressed: _confirmerDeconnexion,
icon: const Icon(Icons.chevron_left, size: 22),
label: const Text(
"Se déconnecter",
style: TextStyle(
fontSize: 15,
fontWeight: FontWeight.w700,
),
),
),
),
const SizedBox(height: 20),
// Version de l'application
Text(
"Résidence Houphouët • Version 1.0.0",
style: TextStyle(
color: Colors.grey.shade500,
fontSize: 12,
),
),
],
),
),
);
},
);
}
Widget _buildMenuTile({
required IconData icon,
required String title,
required String subtitle,
required VoidCallback onTap,
}) {
return ListTile(
onTap: onTap,
contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
leading: Container(
width: 42,
height: 42,
decoration: BoxDecoration(
color: const Color(0xFFEDF1FC),
borderRadius: BorderRadius.circular(12),
),
child: Icon(
icon,
color: AppColors.bleuBouton,
size: 21,
),
),
title: Text(
title,
style: TextStyle(
color: AppColors.bleuprofond,
fontSize: 15,
fontWeight: FontWeight.w700,
),
),
subtitle: Text(
subtitle,
style: TextStyle(
color: Colors.grey.shade500,
fontSize: 12,
),
),
trailing: Icon(
Icons.chevron_right_rounded,
color: Colors.grey.shade400,
size: 22,
),
);
}
Widget _buildDivider() {
return Divider(
height: 1,
thickness: 1,
indent: 74,
endIndent: 16,
color: Colors.grey.shade100,
);
}
}