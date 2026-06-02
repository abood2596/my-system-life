package com.farra.systemlife.feature.today

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
class TodayViewModel @Inject constructor(
    dhikrDao: DhikrDao,
    recoveryDao: RecoveryDao,
    baqarahDao: BaqarahDao,
) : ViewModel() {

    private val today = DateUtils.todayEpochDay()

    val recoveryStreak = recoveryDao.state().map { s ->
        if (s == null) 0L else (today - s.streakStartEpochDay).coerceAtLeast(0)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val dhikrToday = dhikrDao.totalForDay(today)
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val baqarahDone = baqarahDao.forDay(today).map { (it?.count ?: 0) > 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)
}
