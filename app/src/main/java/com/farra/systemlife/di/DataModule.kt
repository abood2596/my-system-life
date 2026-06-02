package com.farra.systemlife.di

import android.content.Context
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import com.farra.systemlife.data.db.AppDatabase
import com.farra.systemlife.data.db.BaqarahDao
import com.farra.systemlife.data.db.DEFAULT_DHIKR
import com.farra.systemlife.data.db.DhikrDao
import com.farra.systemlife.data.db.RecoveryDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import javax.inject.Provider
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DataModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context,
        dhikrDaoProvider: Provider<DhikrDao>,
    ): AppDatabase {
        return Room.databaseBuilder(context, AppDatabase::class.java, "system_life.db")
            .addCallback(object : RoomDatabase.Callback() {
                override fun onCreate(db: SupportSQLiteDatabase) {
                    super.onCreate(db)
                    CoroutineScope(SupervisorJob() + Dispatchers.IO).launch {
                        dhikrDaoProvider.get().insertTypes(DEFAULT_DHIKR)
                    }
                }
            })
            .fallbackToDestructiveMigration()
            .build()
    }

    @Provides fun provideDhikrDao(db: AppDatabase): DhikrDao = db.dhikrDao()
    @Provides fun provideRecoveryDao(db: AppDatabase): RecoveryDao = db.recoveryDao()
    @Provides fun provideBaqarahDao(db: AppDatabase): BaqarahDao = db.baqarahDao()
}
