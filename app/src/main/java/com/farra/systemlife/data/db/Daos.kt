package com.farra.systemlife.data.db

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface DhikrDao {
    @Query("SELECT * FROM dhikr_types ORDER BY sortOrder ASC")
    fun types(): Flow<List<DhikrType>>

    @Query("SELECT COUNT(*) FROM dhikr_types")
    suspend fun typesCount(): Int

    @Insert
    suspend fun insertTypes(types: List<DhikrType>)

    @Insert
    suspend fun insertLog(log: DhikrLog)

    @Query("SELECT COALESCE(SUM(count),0) FROM dhikr_logs WHERE typeId = :typeId AND epochDay = :day")
    fun typeCountForDay(typeId: Long, day: Long): Flow<Int>

    @Query("SELECT COALESCE(SUM(count),0) FROM dhikr_logs WHERE typeId = :typeId")
    fun typeTotal(typeId: Long): Flow<Int>

    @Query("SELECT COALESCE(SUM(count),0) FROM dhikr_logs WHERE epochDay = :day")
    fun totalForDay(day: Long): Flow<Int>

    @Query("SELECT COALESCE(SUM(count),0) FROM dhikr_logs WHERE epochDay >= :from")
    fun totalSince(from: Long): Flow<Int>

    @Query("SELECT COALESCE(SUM(count),0) FROM dhikr_logs")
    fun totalAll(): Flow<Int>

    @Query("SELECT epochDay AS epochDay, COALESCE(SUM(count),0) AS total FROM dhikr_logs WHERE epochDay >= :from GROUP BY epochDay")
    fun dailyTotalsSince(from: Long): Flow<List<DayTotal>>
}

data class DayTotal(val epochDay: Long, val total: Int)

@Dao
interface RecoveryDao {
    @Query("SELECT * FROM recovery_state WHERE id = 0")
    fun state(): Flow<RecoveryState?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(state: RecoveryState)

    @Insert
    suspend fun insertRelapse(log: RelapseLog)

    @Query("SELECT * FROM relapse_logs ORDER BY timestamp DESC")
    fun relapses(): Flow<List<RelapseLog>>

    @Insert
    suspend fun insertExercise(log: ExerciseLog)

    @Query("SELECT * FROM exercise_logs WHERE epochDay = :day ORDER BY timestamp DESC")
    fun exercisesForDay(day: Long): Flow<List<ExerciseLog>>
}

@Dao
interface BaqarahDao {
    @Query("SELECT * FROM baqarah_logs WHERE epochDay = :day")
    fun forDay(day: Long): Flow<BaqarahLog?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun upsert(log: BaqarahLog)

    @Query("SELECT * FROM baqarah_logs ORDER BY epochDay DESC")
    fun all(): Flow<List<BaqarahLog>>

    @Query("SELECT COUNT(*) FROM baqarah_logs WHERE epochDay >= :from AND count > 0")
    fun daysSince(from: Long): Flow<Int>
}
