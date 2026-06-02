# Keep Moshi/Retrofit model classes
-keepclassmembers class com.farra.systemlife.** { *; }
-keep,allowobfuscation,allowshrinking interface retrofit2.Call
-keep,allowobfuscation,allowshrinking class retrofit2.Response
