package com.farra.systemlife.feature.recovery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farra.systemlife.core.time.DateUtils
import com.farra.systemlife.data.db.ExerciseLog
import com.farra.systemlife.data.db.RecoveryDao
import com.farra.systemlife.data.db.RecoveryState
import com.farra.systemlife.data.db.RelapseLog
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class BrainStage(val title: String, val range: String, val brain: String, val feelings: String)

@HiltViewModel
class RecoveryViewModel @Inject constructor(
    private val dao: RecoveryDao,
) : ViewModel() {

    private val today = DateUtils.todayEpochDay()

    val state = dao.state().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    /** أيام السلسلة الحالية. */
    val streakDays = dao.state().map { s ->
        if (s == null) 0L else (today - s.streakStartEpochDay).coerceAtLeast(0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val relapses = dao.relapses().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val exercisesToday = dao.exercisesForDay(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        viewModelScope.launch {
            if (dao.state().first() == null) {
                dao.upsert(RecoveryState(id = 0, streakStartEpochDay = today, lifetimeCleanDays = 0, bestStreak = 0))
            }
        }
    }

    fun logRelapse(trigger: String, note: String) {
        viewModelScope.launch {
            val s = dao.state().first() ?: RecoveryState(streakStartEpochDay = today)
            val prior = (today - s.streakStartEpochDay).coerceAtLeast(0)
            dao.insertRelapse(RelapseLog(epochDay = today, trigger = trigger, note = note, priorStreak = prior, timestamp = System.currentTimeMillis()))
            dao.upsert(
                s.copy(
                    streakStartEpochDay = today,
                    lifetimeCleanDays = s.lifetimeCleanDays + prior,
                    bestStreak = maxOf(s.bestStreak, prior),
                ),
            )
        }
    }

    fun logExercise(type: String, reps: Int) {
        viewModelScope.launch {
            dao.insertExercise(ExerciseLog(epochDay = today, type = type, reps = reps, timestamp = System.currentTimeMillis()))
        }
    }

    companion object {
        fun stageFor(day: Long): BrainStage = when (day) {
            in 0..14 -> BrainStage("السحب الحاد", "اليوم ١–١٤", "الدماغ محروم فجأة من التحفيز المفرط؛ دائرة المكافأة شديدة التفاعل.", "رغبات قوية، تهيّج، أرق، تشوّش ذهني — هذا طبيعي وسيمرّ.")
            in 15..42 -> BrainStage("الـFlatline", "أسبوع ٢–٦", "إعادة معايرة مستقبلات الدوبامين ورفع حساسيتها تدريجياً.", "فتور رغبة، خمول، تبلّد — وهذه علامة تعافٍ وليست فشلاً.")
            in 43..89 -> BrainStage("التعافي المبكر", "أسبوع ٦–١٢", "عودة حساسية المكافأة وتقوية الفص الجبهي (ضبط النفس).", "صفاء ذهني أوضح، رغبات أقل، مزاج أفضل.")
            in 90..179 -> BrainStage("الترسيخ", "٣–٦ أشهر", "إعادة معايرة جوهرية لدائرة المكافأة وتثبيت المسارات الجديدة.", "ثقة، تركيز، استقرار مزاجي، انجذاب واقعي صحي.")
            else -> BrainStage("إعادة التوصيل", "٦–١٢+ شهر", "تشكّل مسارات عصبية جديدة وإضعاف القديمة (Neuroplasticity).", "خط أساس جديد للحياة، وخطر انتكاس أقل بكثير.")
        }

        val milestones = listOf(1L, 7, 14, 30, 90, 180, 365)
    }
}
