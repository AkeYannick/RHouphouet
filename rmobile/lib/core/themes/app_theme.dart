import 'package:flutter/material.dart';

import 'app_colors.dart';

class AppTheme {

  
  static final ColorScheme _lightScheme = ColorScheme.fromSeed(
    seedColor: AppColors.bleuprofond,
    brightness: Brightness.light,
  ).copyWith(
    primary: AppColors.bleuprofond,
    onPrimary: AppColors.blanc,
    primaryContainer: AppColors.bleuclair,
    onPrimaryContainer: AppColors.bleuprofond,
    secondary: AppColors.bleuclair,
    onSecondary: AppColors.bleuprofond,
    surface: AppColors.blanc,
  );


  static final ColorScheme _darkScheme = ColorScheme.fromSeed(
    seedColor: AppColors.bleuprofond,
    brightness: Brightness.dark,
  ).copyWith(
    primary: AppColors.bleuclair,
    onPrimary: AppColors.bleuprofond,
    primaryContainer: AppColors.bleuprofond,
    onPrimaryContainer: AppColors.bleuclair,
    secondary: AppColors.bleuclair,
  );

  static ThemeData get light => _build(_lightScheme);
  static ThemeData get dark => _build(_darkScheme);


  static ThemeData _build(ColorScheme scheme) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: scheme.surface,
      appBarTheme: AppBarTheme(
        backgroundColor: scheme.surface,
        foregroundColor: scheme.onSurface,
        elevation: 0,
        centerTitle: true,
      ),
      inputDecorationTheme: InputDecorationTheme(
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: scheme.primary, width: 2),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
      navigationBarTheme: NavigationBarThemeData(
        indicatorColor: scheme.primaryContainer,
      ),
    );
  }
}