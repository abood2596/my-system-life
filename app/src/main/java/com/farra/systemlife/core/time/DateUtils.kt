package com.farra.systemlife.core.time

import java.time.LocalDate

/** أدوات التاريخ المبنية على «رقم اليوم» (epoch day) لتتبّع السلاسل والحصائل. */
object DateUtils {
    fun todayEpochDay(): Long = LocalDate.now().toEpochDay()

    /** بداية الأسبوع الحالي (٧ أيام للخلف). */
    fun weekStartEpochDay(): Long = todayEpochDay() - 6

    /** بداية الشهر الحالي. */
    fun monthStartEpochDay(): Long = LocalDate.now().withDayOfMonth(1).toEpochDay()

    /** يحوّل عدد الأيام إلى نص عربي (يوم/أيام). */
    fun daysLabel(days: Long): String = when (days) {
        0L -> "اليوم"
        1L -> "يوم واحد"
        2L -> "يومان"
        in 3..10 -> "$days أيام"
        else -> "$days يوماً"
    }

    /**
     * يحسب أطول سلسلة أيام متتالية منتهية باليوم/أمس من قائمة أيام مكتملة.
     */
    fun currentStreak(completedDays: Set<Long>): Long {
        val today = todayEpochDay()
        var day = if (completedDays.contains(today)) today else today - 1
        if (!completedDays.contains(day)) return 0
        var streak = 0L
        while (completedDays.contains(day)) {
            streak++
            day--
        }
        return streak
    }
}
