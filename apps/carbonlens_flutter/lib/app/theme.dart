import 'package:flutter/material.dart';

ThemeData carbonLensTheme() {
  final colors = ColorScheme.fromSeed(seedColor: const Color(0xff008b5b))
      .copyWith(
        primary: const Color(0xff008b5b),
        onPrimary: Colors.white,
        surface: Colors.white,
        onSurface: const Color(0xff10243b),
      );
  return ThemeData(
    useMaterial3: true,
    fontFamily: 'Roboto',
    colorScheme: colors,
    scaffoldBackgroundColor: const Color(0xfff8fbfa),
    textTheme: const TextTheme(
      headlineLarge: TextStyle(
        fontSize: 30,
        fontWeight: FontWeight.w800,
        color: Color(0xff10243b),
      ),
      headlineSmall: TextStyle(fontSize: 24, fontWeight: FontWeight.w700),
      titleLarge: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
      titleMedium: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
      bodyMedium: TextStyle(fontSize: 14, height: 1.45),
      bodySmall: TextStyle(fontSize: 12, height: 1.4, color: Color(0xff53667b)),
    ),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.white,
      centerTitle: true,
      elevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Colors.white,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(18),
        side: const BorderSide(color: Color(0xffe8efed)),
      ),
    ),
    dividerTheme: const DividerThemeData(
      color: Color(0xffe8efed),
      thickness: 1,
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: const BorderSide(color: Color(0xffdce7e2)),
      ),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      ),
    ),
  );
}
