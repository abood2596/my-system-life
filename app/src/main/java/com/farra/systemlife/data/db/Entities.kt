package com.farra.systemlife.data.db

import androidx.room.Entity
import androidx.room.PrimaryKey

/** نوع ذكر (استغفار، تسبيح…) مع فضله وهدفه اليومي. */
@Entity(tableName = "dhikr_types")
data class DhikrType(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val name: String,
    val phrase: String,
    val virtue: String,
    val dailyTarget: Int,
    val sortOrder: Int = 0,
)

/** سجل تسبيح (يدعم الإضافة بالجملة عبر count). */
@Entity(tableName = "dhikr_logs")
data class DhikrLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val typeId: Long,
    val count: Int,
    val epochDay: Long,
    val timestamp: Long,
)

/** حالة التعافي (صف واحد). */
@Entity(tableName = "recovery_state")
data class RecoveryState(
    @PrimaryKey val id: Int = 0,
    val streakStartEpochDay: Long,
    val lifetimeCleanDays: Long = 0,
    val bestStreak: Long = 0,
)

/** سجل انتكاسة (غير قضائي — للتعلّم). */
@Entity(tableName = "relapse_logs")
data class RelapseLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val epochDay: Long,
    val trigger: String,
    val note: String,
    val priorStreak: Long,
    val timestamp: Long,
)

/** سجل تمرين بديل (بروتوكول الإنقاذ: ضغط/سكوات…). */
@Entity(tableName = "exercise_logs")
data class ExerciseLog(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val epochDay: Long,
    val type: String,
    val reps: Int,
    val timestamp: Long,
)

/** سجل تلاوة سورة البقرة اليومي. */
@Entity(tableName = "baqarah_logs")
data class BaqarahLog(
    @PrimaryKey val epochDay: Long,
    val count: Int,
    val timestamp: Long,
)
