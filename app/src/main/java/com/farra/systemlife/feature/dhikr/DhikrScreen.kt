package com.farra.systemlife.feature.dhikr

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.FilterChip
import androidx.compose.material3.FilterChipDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farra.systemlife.ui.components.CircularCounter
import com.farra.systemlife.ui.components.GoldCard
import com.farra.systemlife.ui.components.MetricTile
import com.farra.systemlife.ui.components.RoyalBackground
import com.farra.systemlife.ui.components.SectionTitle

@Composable
fun DhikrScreen(vm: DhikrViewModel = hiltViewModel()) {
    val types by vm.types.collectAsState()
    val selected by vm.selected.collectAsState()
    val todayCount by vm.selectedToday.collectAsState()
    val typeTotal by vm.selectedTotal.collectAsState()
    val tToday by vm.totalToday.collectAsState()
    val tWeek by vm.totalWeek.collectAsState()
    val tMonth by vm.totalMonth.collectAsState()
    val tAll by vm.totalAll.collectAsState()

    val haptic = LocalHapticFeedback.current
    var showBulk by remember { mutableStateOf(false) }

    RoyalBackground {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // اختيار الذكر
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(types) { t ->
                    FilterChip(
                        selected = selected?.id == t.id,
                        onClick = { vm.select(t) },
                        label = { Text(t.name) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = MaterialTheme.colorScheme.primary,
                            selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                        ),
                    )
                }
            }

            // العبارة والفضل
            selected?.let { t ->
                GoldCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(t.phrase, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, textAlign = TextAlign.Center)
                        Text(t.virtue, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, textAlign = TextAlign.Center)
                    }
                }
            }

            // العدّاد
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                CircularCounter(value = todayCount, target = selected?.dailyTarget ?: 100, label = "اليوم / ${selected?.dailyTarget ?: 100}")

                Button(
                    onClick = { haptic.performHapticFeedback(HapticFeedbackType.LongPress); vm.add(1) },
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                ) {
                    Text("سبّح  +١", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(vertical = 8.dp))
                }

                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    listOf(10, 33, 100).forEach { n ->
                        OutlinedButton(onClick = { vm.add(n) }, modifier = Modifier.weight(1f)) { Text("+$n") }
                    }
                    OutlinedButton(onClick = { showBulk = true }, modifier = Modifier.weight(1f)) { Text("بالجملة") }
                }
            }

            SectionTitle("الحصيلة")
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$tToday", "اليوم", Modifier.weight(1f))
                MetricTile("$tWeek", "الأسبوع", Modifier.weight(1f))
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("$tMonth", "الشهر", Modifier.weight(1f))
                MetricTile("$tAll", "الإجمالي الكلي", Modifier.weight(1f))
            }
            selected?.let {
                MetricTile("$typeTotal", "إجمالي «${it.name}»", Modifier.fillMaxWidth())
            }
        }
    }

    if (showBulk) {
        var input by remember { mutableStateOf("") }
        AlertDialog(
            onDismissRequest = { showBulk = false },
            title = { Text("إضافة بالجملة") },
            text = {
                OutlinedTextField(
                    value = input,
                    onValueChange = { input = it.filter { c -> c.isDigit() } },
                    label = { Text("العدد (مثلاً ٤٠٠)") },
                    keyboardOptions = androidx.compose.foundation.text.KeyboardOptions(keyboardType = KeyboardType.Number),
                    singleLine = true,
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    input.toIntOrNull()?.let { if (it > 0) vm.add(it) }
                    showBulk = false
                }) { Text("إضافة") }
            },
            dismissButton = { TextButton(onClick = { showBulk = false }) { Text("إلغاء") } },
        )
    }
}
