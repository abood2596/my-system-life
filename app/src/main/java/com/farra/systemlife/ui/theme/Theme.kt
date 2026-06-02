package com.farra.systemlife.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColors = darkColorScheme(
    primary = RoyalGold,
    onPrimary = MidnightEmerald,
    primaryContainer = Emerald,
    onPrimaryContainer = TextOnDark,
    secondary = GoldSoft,
    onSecondary = MidnightEmerald,
    tertiary = EmeraldBright,
    background = MidnightEmerald,
    onBackground = TextOnDark,
    surface = SurfaceDark,
    onSurface = TextOnDark,
    surfaceVariant = SurfaceDarkHigh,
    onSurfaceVariant = TextOnDarkMuted,
    error = DangerRed,
    outline = GoldSoft,
)

private val LightColors = lightColorScheme(
    primary = Emerald,
    onPrimary = Ivory,
    primaryContainer = GoldLight,
    onPrimaryContainer = EmeraldDeep,
    secondary = RoyalGold,
    onSecondary = Ivory,
    tertiary = EmeraldBright,
    background = Ivory,
    onBackground = TextOnLight,
    surface = IvorySurface,
    onSurface = TextOnLight,
    surfaceVariant = androidx.compose.ui.graphics.Color(0xFFEAE3D2),
    onSurfaceVariant = TextOnLight,
    error = DangerRed,
    outline = RoyalGold,
)

@Composable
fun MySystemLifeTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit,
) {
    val colors = if (darkTheme) DarkColors else LightColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        content = content,
    )
}
