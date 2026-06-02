package com.farra.systemlife.feature.dhikr

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.farra.systemlife.core.time.DateUtils
import com.farra.systemlife.data.db.DhikrDao
import com.farra.systemlife.data.db.DhikrLog
import com.farra.systemlife.data.db.DhikrType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.flatMapLatest
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class DhikrViewModel @Inject constructor(
    private val dao: DhikrDao,
) : ViewModel() {

    private val today = DateUtils.todayEpochDay()

    val types = dao.types().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val selectedId = MutableStateFlow<Long?>(null)

    val selected = combine(types, selectedId) { list, id ->
        list.firstOrNull { it.id == id } ?: list.firstOrNull()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)

    val selectedToday = selected.flatMapLatest { t ->
        if (t == null) flowOf(0) else dao.typeCountForDay(t.id, today)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val selectedTotal = selected.flatMapLatest { t ->
        if (t == null) flowOf(0) else dao.typeTotal(t.id)
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    val totalToday = dao.totalForDay(today).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    val totalWeek = dao.totalSince(DateUtils.weekStartEpochDay()).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    val totalMonth = dao.totalSince(DateUtils.monthStartEpochDay()).stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)
    val totalAll = dao.totalAll().stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0)

    fun select(type: DhikrType) {
        selectedId.value = type.id
    }

    fun add(count: Int) {
        val t = selected.value ?: return
        viewModelScope.launch {
            dao.insertLog(DhikrLog(typeId = t.id, count = count, epochDay = today, timestamp = System.currentTimeMillis()))
        }
    }
}
