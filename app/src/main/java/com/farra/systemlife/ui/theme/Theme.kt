package com.farra.systemlife.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColors = darkColorScheme(
    primary = RoyalGold,
    onPrimary = MidnightEmerald,
    primaryContainer = Emerald,
    onPrimaryContainer = TextOnDark,
    secondary = EmeraldGlow,
    onSecondary = MidnightEmerald,
    secondaryContainer = SurfaceDarkHigh,
    onSecondaryContainer = TextOnDark,
    tertiary = GoldLight,
    background = MidnightEmerald,
    onBackground = TextOnDark,
    surface = SurfaceDark,
    onSurface = TextOnDark,
    surfaceVariant = SurfaceDarkHigh,
    onSurfaceVariant = TextOnDarkMuted,
    error = DangerRed,
    onError = Color.White,
    outline = GoldDeep,
)

private val LightColors = lightColorScheme(
    primary = Emerald,
    onPrimary = Ivory,
    primaryContainer = GoldLight,
    onPrimaryContainer = EmeraldDeep,
    secondary = EmeraldBright,
    onSecondary = Ivory,
    tertiary = GoldDeep,
    background = Ivory,
    onBackground = TextOnLight,
    surface = IvorySurface,
    onSurface = TextOnLight,
    surfaceVariant = IvoryVariant,
    onSurfaceVariant = TextOnLight,
    error = DangerRed,
    outline = GoldDeep,
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
