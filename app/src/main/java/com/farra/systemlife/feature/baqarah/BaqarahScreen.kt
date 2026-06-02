package com.farra.systemlife.feature.baqarah

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farra.systemlife.ui.components.GoldCard
import com.farra.systemlife.ui.components.MetricTile
import com.farra.systemlife.ui.components.RoyalBackground
import com.farra.systemlife.ui.theme.SuccessGreen

@Composable
fun BaqarahScreen(vm: BaqarahViewModel = hiltViewModel()) {
    val todayCount by vm.todayCount.collectAsState()
    val streak by vm.streak.collectAsState()
    val total by vm.totalDays.collectAsState()
    val month by vm.monthCount.collectAsState()

    val doneToday = todayCount > 0

    RoyalBackground {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            GoldCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().padding(22.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("📖 سورة البقرة", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text(
                        if (doneToday) "أتممت تلاوة اليوم ✓ ($todayCount مرة)" else "لم تُكمل تلاوة اليوم بعد",
                        style = MaterialTheme.typography.titleMedium,
                        color = if (doneToday) SuccessGreen else MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center,
                    )
                    Text("«لا تجعلوا بيوتكم مقابر، فإن الشيطان ينفر من البيت الذي تُقرأ فيه سورة البقرة».", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                }
            }

            Button(
                onClick = { vm.markRead() },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = if (doneToday) SuccessGreen else MaterialTheme.colorScheme.primary),
            ) {
                Text(if (doneToday) "تلاوة إضافية اليوم +" else "أتممت التلاوة اليوم ✓", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 6.dp))
            }

            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$streak", "سلسلة متتالية", Modifier.weight(1f), SuccessGreen)
                MetricTile("$month", "هذا الشهر", Modifier.weight(1f))
            }
            MetricTile("$total", "إجمالي أيام التلاوة", Modifier.fillMaxWidth())
        }
    }
}
