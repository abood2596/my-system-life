package com.farra.systemlife.feature.stats

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farra.systemlife.ui.components.GoldCard
import com.farra.systemlife.ui.components.MetricTile
import com.farra.systemlife.ui.components.RoyalBackground
import com.farra.systemlife.ui.components.SectionTitle
import com.farra.systemlife.ui.components.SimpleLineChart
import com.farra.systemlife.ui.theme.SuccessGreen

@Composable
fun StatsScreen(vm: StatsViewModel = hiltViewModel()) {
    val weekly by vm.weeklyDhikr.collectAsState()
    val dhikrAll by vm.dhikrAll.collectAsState()
    val dhikrWeek by vm.dhikrWeek.collectAsState()
    val streak by vm.recoveryStreak.collectAsState()
    val lifetime by vm.recoveryLifetime.collectAsState()
    val baqarah by vm.baqarahTotal.collectAsState()

    RoyalBackground {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            SectionTitle("أذكار آخر ٧ أيام")
            GoldCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().padding(12.dp)) {
                    if (weekly.sum() > 0f) {
                        SimpleLineChart(weekly, Modifier.fillMaxWidth())
                    } else {
                        Text("لا توجد بيانات بعد — ابدأ التسبيح لتظهر هنا.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(16.dp))
                    }
                }
            }

            SectionTitle("الحصائل")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$dhikrWeek", "أذكار الأسبوع", Modifier.weight(1f))
                MetricTile("$dhikrAll", "أذكار إجمالية", Modifier.weight(1f))
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$streak", "سلسلة التعافي", Modifier.weight(1f), SuccessGreen)
                MetricTile("$lifetime", "إجمالي أيام النظافة", Modifier.weight(1f), SuccessGreen)
            }
            MetricTile("$baqarah", "أيام تلاوة البقرة", Modifier.fillMaxWidth())
        }
    }
}
