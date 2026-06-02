package com.farra.systemlife.feature.recovery

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.AssistChip
import androidx.compose.material3.AssistChipDefaults
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.farra.systemlife.core.time.DateUtils
import com.farra.systemlife.ui.components.GoldCard
import com.farra.systemlife.ui.components.MetricTile
import com.farra.systemlife.ui.components.RoyalBackground
import com.farra.systemlife.ui.components.SectionTitle
import com.farra.systemlife.ui.theme.DangerRed
import com.farra.systemlife.ui.theme.SuccessGreen

@Composable
fun RecoveryScreen(vm: RecoveryViewModel = hiltViewModel()) {
    val state by vm.state.collectAsState()
    val streak by vm.streakDays.collectAsState()
    val relapses by vm.relapses.collectAsState()
    val exercises by vm.exercisesToday.collectAsState()

    var showPanic by remember { mutableStateOf(false) }
    var showRelapse by remember { mutableStateOf(false) }

    val stage = RecoveryViewModel.stageFor(streak)

    RoyalBackground {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            // العدّاد المزدوج
            GoldCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().padding(20.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("سلسلتك الحالية", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("$streak", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text(DateUtils.daysLabel(streak), style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                }
            }
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricTile("${(state?.lifetimeCleanDays ?: 0) + streak}", "إجمالي أيام النظافة", Modifier.weight(1f), SuccessGreen)
                MetricTile("${maxOf(state?.bestStreak ?: 0, streak)}", "أفضل سلسلة", Modifier.weight(1f))
            }

            // بطاقة دماغك الآن
            GoldCard(Modifier.fillMaxWidth()) {
                Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("🧠 دماغك الآن — ${stage.title}", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text(stage.range, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.tertiary)
                    Text(stage.brain, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                    Text("ما تشعر به: ${stage.feelings}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                }
            }

            // المحطّات
            SectionTitle("المحطّات", Modifier.fillMaxWidth())
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(RecoveryViewModel.milestones) { m ->
                    val reached = streak >= m
                    AssistChip(
                        onClick = {},
                        label = { Text(if (reached) "✓ $m" else "$m") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = if (reached) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surface,
                            labelColor = if (reached) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                        ),
                    )
                }
            }

            // زر الطوارئ
            Button(
                onClick = { showPanic = true },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = DangerRed),
            ) { Text("🚨 أشعر برغبة — بروتوكول الإنقاذ", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(vertical = 6.dp)) }

            OutlinedButton(onClick = { showRelapse = true }, modifier = Modifier.fillMaxWidth()) {
                Text("تسجيل انتكاسة (بصدق ودون لوم)")
            }

            if (exercises.isNotEmpty()) {
                SectionTitle("تمارين اليوم", Modifier.fillMaxWidth())
                GoldCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                        exercises.forEach { e ->
                            Text("• ${e.type}: ${e.reps} عدّة", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurface)
                        }
                    }
                }
            }

            if (relapses.isNotEmpty()) {
                SectionTitle("سجل التعلّم", Modifier.fillMaxWidth())
                GoldCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        relapses.take(5).forEach { r ->
                            Text("المحفّز: ${r.trigger}${if (r.note.isNotBlank()) " — ${r.note}" else ""}", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            }
        }
    }

    if (showPanic) PanicDialog(onExercise = vm::logExercise, onDismiss = { showPanic = false })
    if (showRelapse) RelapseDialog(onConfirm = { t, n -> vm.logRelapse(t, n); showRelapse = false }, onDismiss = { showRelapse = false })
}

@Composable
private fun PanicDialog(onExercise: (String, Int) -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("بروتوكول الإنقاذ") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("الرغبة موجة تعلو ثم تنكسر خلال ٢٠–٣٠ دقيقة. لا تتحرّك معها — راقبها فقط.", style = MaterialTheme.typography.bodyMedium)
                Text("تنفّس: شهيق ٤، حبس ٤، زفير ٦. كرّرها.", style = MaterialTheme.typography.bodyMedium)
                Text("افحص HALT: هل أنت جائع/غاضب/وحيد/متعب؟", style = MaterialTheme.typography.bodyMedium)
                Text("حوّل الطاقة لتمرين بدني وسجّله:", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.primary)
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedButton(onClick = { onExercise("ضغط", 20) }, modifier = Modifier.weight(1f)) { Text("٢٠ ضغط") }
                    OutlinedButton(onClick = { onExercise("سكوات", 50) }, modifier = Modifier.weight(1f)) { Text("٥٠ سكوات") }
                }
            }
        },
        confirmButton = { TextButton(onClick = onDismiss) { Text("مرّت الرغبة ✓") } },
    )
}

@Composable
private fun RelapseDialog(onConfirm: (String, String) -> Unit, onDismiss: () -> Unit) {
    var trigger by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("تسجيل انتكاسة") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("الانتكاسة بيانات نتعلّم منها لا فشل. سلسلتك تبدأ من جديد، لكن إجمالي أيامك يبقى محفوظاً.", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                OutlinedTextField(value = trigger, onValueChange = { trigger = it }, label = { Text("المحفّز (ملل/وحدة/تعب…)") }, singleLine = true)
                OutlinedTextField(value = note, onValueChange = { note = it }, label = { Text("ماذا سأفعل مختلفاً؟") })
            }
        },
        confirmButton = { TextButton(onClick = { onConfirm(trigger.ifBlank { "غير محدّد" }, note) }) { Text("حفظ وبدء من جديد") } },
        dismissButton = { TextButton(onClick = onDismiss) { Text("إلغاء") } },
    )
}
