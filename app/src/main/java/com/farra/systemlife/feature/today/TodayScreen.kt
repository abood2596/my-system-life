package com.farra.systemlife.feature.today

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
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farra.systemlife.R
import com.farra.systemlife.ui.components.DedicationCard
import com.farra.systemlife.ui.components.GoldCard
import com.farra.systemlife.ui.components.MetricTile
import com.farra.systemlife.ui.components.RoyalBackground
import com.farra.systemlife.ui.components.SectionTitle
import com.farra.systemlife.ui.theme.SuccessGreen
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

@Composable
fun TodayScreen(vm: TodayViewModel = hiltViewModel()) {
    val streak by vm.recoveryStreak.collectAsState()
    val dhikr by vm.dhikrToday.collectAsState()
    val baqarah by vm.baqarahDone.collectAsState()

    val dateStr = remember { LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE d MMMM yyyy", Locale("ar"))) }

    RoyalBackground {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            GoldCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().padding(20.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("السلام عليكم ورحمة الله", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text(dateStr, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            SectionTitle("نظرة اليوم")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$streak", "سلسلة التعافي", Modifier.weight(1f), SuccessGreen)
                MetricTile("$dhikr", "أذكار اليوم", Modifier.weight(1f))
            }
            MetricTile(if (baqarah) "✓ تمّت" else "بعد", "تلاوة البقرة اليوم", Modifier.fillMaxWidth(), if (baqarah) SuccessGreen else MaterialTheme.colorScheme.primary)

            DedicationCard(
                title = stringResource(R.string.dedication_title),
                body = stringResource(R.string.dedication_body),
                sub = stringResource(R.string.dedication_sub),
                dua = stringResource(R.string.dedication_dua),
            )
        }
    }
}
