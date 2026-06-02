package com.farra.systemlife.core.time

import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * منسّق الوقت المركزي — يعتمد نظام ١٢ ساعة في كل التطبيق.
 * مثال: 5:32 م
 */
object TimeFormat {

    private val arabicLocale = Locale("ar")

    private val formatter12h: DateTimeFormatter =
        DateTimeFormatter.ofPattern("h:mm a", arabicLocale)

    /** يحوّل وقتاً إلى صيغة ١٢ ساعة بالعربية (ص/م). */
    fun to12h(time: LocalTime): String = time.format(formatter12h)

    /** يحوّل ساعة ودقيقة إلى صيغة ١٢ ساعة. */
    fun to12h(hour: Int, minute: Int): String =
        to12h(LocalTime.of(hour.coerceIn(0, 23), minute.coerceIn(0, 59)))
}
