package com.farra.systemlife.feature.stats

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farra.systemlife.core.time.DateUtils
import com.farra.systemlife.data.db.BaqarahDao
import com.farra.systemlife.data.db.DhikrDao
import com.farra.systemlife.data.db.RecoveryDao
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

@HiltViewModel
class StatsViewModel @Inject constructor(
    dhikrDao: DhikrDao,
    recoveryDao: RecoveryDao,
    baqarahDao: BaqarahDao,
) : ViewModel() {

    private val today = DateUtils.todayEpochDay()
    private val weekStart = DateUtils.weekStartEpochDay()

    /** قيم أذكار آخر ٧ أيام (مرتّبة) مع تعبئة الأيام الفارغة بصفر. */
    val weeklyDhikr = dhikrDao.dailyTotalsSince(weekStart).map { rows ->
        val byDay = rows.associate { it.epochDay to it.total }
        (weekStart..today).map { (byDay[it] ?: 0).toFloat() }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val dhikrAll = dhikrDao.totalAll().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    val dhikrWeek = dhikrDao.totalSince(weekStart).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val recoveryStreak = recoveryDao.state().map { s ->
        if (s == null) 0L else (today - s.streakStartEpochDay).coerceAtLeast(0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val recoveryLifetime = recoveryDao.state().map { s ->
        if (s == null) 0L else s.lifetimeCleanDays + (today - s.streakStartEpochDay).coerceAtLeast(0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val baqarahTotal = baqarahDao.all().map { logs -> logs.count { it.count > 0 } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
}
