package com.farra.systemlife.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoStories
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Mosque
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.outlined.AutoStories
import androidx.compose.material.icons.outlined.Favorite
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Mosque
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.ui.graphics.vector.ImageVector
import com.farra.systemlife.R

/** الوجهات الأساسية في الشريط السفلي. */
enum class TopDestination(
    val route: String,
    val labelRes: Int,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector,
) {
    Today("today", R.string.tab_today, Icons.Filled.Home, Icons.Outlined.Home),
    Recovery("recovery", R.string.tab_recovery, Icons.Filled.Shield, Icons.Outlined.Shield),
    Dhikr("dhikr", R.string.tab_dhikr, Icons.Filled.Favorite, Icons.Outlined.Favorite),
    Baqarah("baqarah", R.string.tab_baqarah, Icons.Filled.AutoStories, Icons.Outlined.AutoStories),
    Prayer("prayer", R.string.tab_prayer, Icons.Filled.Mosque, Icons.Outlined.Mosque),
}

/** وجهات ثانوية (من الشريط العلوي). */
object Routes {
    const val STATS = "stats"
    const val SETTINGS = "settings"
}
