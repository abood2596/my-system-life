package com.farra.systemlife

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.BarChart
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.farra.systemlife.feature.baqarah.BaqarahScreen
import com.farra.systemlife.feature.dhikr.DhikrScreen
import com.farra.systemlife.feature.prayer.PrayerScreen
import com.farra.systemlife.feature.recovery.RecoveryScreen
import com.farra.systemlife.feature.settings.SettingsScreen
import com.farra.systemlife.feature.stats.StatsScreen
import com.farra.systemlife.feature.today.TodayScreen
import com.farra.systemlife.navigation.Routes
import com.farra.systemlife.navigation.TopDestination
import com.farra.systemlife.ui.theme.MySystemLifeTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setContent {
            MySystemLifeTheme { AppRoot() }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AppRoot() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    val topDestinations = TopDestination.entries
    val isTopLevel = topDestinations.any { it.route == currentRoute }
    val currentTitle = when (currentRoute) {
        Routes.STATS -> stringResource(R.string.action_stats)
        Routes.SETTINGS -> stringResource(R.string.action_settings)
        else -> topDestinations.firstOrNull { it.route == currentRoute }
            ?.let { stringResource(it.labelRes) } ?: stringResource(R.string.app_name)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(currentTitle) },
                colors = TopAppBarDefaults.topAppBarColors(),
                navigationIcon = {
                    if (!isTopLevel) {
                        IconButton(onClick = { navController.navigateUp() }) {
                            Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "رجوع")
                        }
                    }
                },
                actions = {
                    if (isTopLevel) {
                        IconButton(onClick = { navController.navigate(Routes.STATS) }) {
                            Icon(Icons.Filled.BarChart, stringResource(R.string.action_stats))
                        }
                        IconButton(onClick = { navController.navigate(Routes.SETTINGS) }) {
                            Icon(Icons.Filled.Settings, stringResource(R.string.action_settings))
                        }
                    }
                },
            )
        },
        bottomBar = {
            if (isTopLevel) {
                NavigationBar {
                    topDestinations.forEach { dest ->
                        val selected = backStackEntry?.destination?.hierarchy
                            ?.any { it.route == dest.route } == true
                        NavigationBarItem(
                            selected = selected,
                            onClick = {
                                navController.navigate(dest.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = {
                                Icon(
                                    if (selected) dest.selectedIcon else dest.unselectedIcon,
                                    contentDescription = stringResource(dest.labelRes),
                                )
                            },
                            label = { Text(stringResource(dest.labelRes)) },
                        )
                    }
                }
            }
        },
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = TopDestination.Today.route,
            modifier = Modifier.padding(innerPadding),
        ) {
            composable(TopDestination.Today.route) { TodayScreen() }
            composable(TopDestination.Recovery.route) { RecoveryScreen() }
            composable(TopDestination.Dhikr.route) { DhikrScreen() }
            composable(TopDestination.Baqarah.route) { BaqarahScreen() }
            composable(TopDestination.Prayer.route) { PrayerScreen() }
            composable(Routes.STATS) { StatsScreen() }
            composable(Routes.SETTINGS) { SettingsScreen() }
        }
    }
}
