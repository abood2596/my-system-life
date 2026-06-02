package com.farra.systemlife.data.db

import androidx.room.Database
import androidx.room.RoomDatabase

@Database(
    entities = [
        DhikrType::class,
        DhikrLog::class,
        RecoveryState::class,
        RelapseLog::class,
        ExerciseLog::class,
        BaqarahLog::class,
    ],
    version = 1,
    exportSchema = false,
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun dhikrDao(): DhikrDao
    abstract fun recoveryDao(): RecoveryDao
    abstract fun baqarahDao(): BaqarahDao
}

/** الأذكار الافتراضية مع فضائلها. */
val DEFAULT_DHIKR = listOf(
    DhikrType(name = "الاستغفار", phrase = "أَستَغفِرُ اللَّه", virtue = "مفتاح تفريج الكروب وسعة الرزق وغفران الذنوب. قال ﷺ: «من لزم الاستغفار جعل الله له من كل هم فرجاً».", dailyTarget = 100, sortOrder = 0),
    DhikrType(name = "التسبيح", phrase = "سُبحَانَ اللَّه", virtue = "كلمة خفيفة على اللسان ثقيلة في الميزان حبيبة إلى الرحمن.", dailyTarget = 100, sortOrder = 1),
    DhikrType(name = "الحمد", phrase = "الحَمدُ لِلَّه", virtue = "تملأ الميزان، وهي رأس الشكر.", dailyTarget = 100, sortOrder = 2),
    DhikrType(name = "التكبير", phrase = "اللَّهُ أَكبَر", virtue = "تعظيمٌ لله، وممّا تملأ ما بين السماء والأرض.", dailyTarget = 100, sortOrder = 3),
    DhikrType(name = "التهليل", phrase = "لَا إِلَهَ إِلَّا اللَّه", virtue = "أفضل الذكر، ومن قالها مئة مرة كانت له عدل عشر رقاب.", dailyTarget = 100, sortOrder = 4),
    DhikrType(name = "الصلاة على النبي", phrase = "اللَّهُمَّ صَلِّ وَسَلِّم عَلَى نَبِيِّنَا مُحَمَّد", virtue = "من صلّى عليّ صلاة صلّى الله عليه بها عشراً.", dailyTarget = 100, sortOrder = 5),
    DhikrType(name = "حوقلة", phrase = "لَا حَولَ وَلَا قُوَّةَ إِلَّا بِاللَّه", virtue = "كنز من كنوز الجنة.", dailyTarget = 100, sortOrder = 6),
)
