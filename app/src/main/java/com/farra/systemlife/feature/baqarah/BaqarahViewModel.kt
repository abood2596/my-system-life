package com.farra.systemlife.feature.baqarah

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farra.systemlife.core.time.DateUtils
import com.farra.systemlife.data.db.BaqarahDao
import com.farra.systemlife.data.db.BaqarahLog
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class BaqarahViewModel @Inject constructor(
    private val dao: BaqarahDao,
) : ViewModel() {

    private val today = DateUtils.todayEpochDay()

    val todayCount = dao.forDay(today).map { it?.count ?: 0 }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    private val all = dao.all()

    val streak = all.map { logs ->
        DateUtils.currentStreak(logs.filter { it.count > 0 }.map { it.epochDay }.toSet())
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0L)

    val totalDays = all.map { logs -> logs.count { it.count > 0 } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val monthCount = dao.daysSince(DateUtils.monthStartEpochDay())
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun markRead() {
        viewModelScope.launch {
            val current = dao.forDay(today).first()?.count ?: 0
            dao.upsert(BaqarahLog(epochDay = today, count = current + 1, timestamp = System.currentTimeMillis()))
        }
    }
}
