plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
}

android {
    namespace = "com.farra.systemlife"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.farra.ishraq"
        minSdk = 26
        targetSdk = 34
        versionCode = 5
        versionName = "2.1.0"
        vectorDrawables { useSupportLibrary = true }
    }

    // توقيع ثابت من سرّ GitHub (إن وُجد) لضمان تحديثات بلا فقدان بيانات.
    // لا يوجد أي مفتاح داخل المستودع؛ يُقرأ من متغيرات البيئة فقط.
    val ksPath = System.getenv("ISHRAQ_KEYSTORE_FILE")
    val hasKeystore = ksPath != null && file(ksPath).exists()
    if (hasKeystore) {
        signingConfigs {
            create("ishraq") {
                storeFile = file(ksPath!!)
                storePassword = System.getenv("ISHRAQ_KEYSTORE_PASSWORD")
                keyAlias = System.getenv("ISHRAQ_KEY_ALIAS") ?: "ishraq"
                keyPassword = System.getenv("ISHRAQ_KEY_PASSWORD")
                    ?: System.getenv("ISHRAQ_KEYSTORE_PASSWORD")
            }
        }
    }

    buildTypes {
        debug {
            if (hasKeystore) signingConfig = signingConfigs.getByName("ishraq")
        }
        release {
            isMinifyEnabled = false
            if (hasKeystore) signingConfig = signingConfigs.getByName("ishraq")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro",
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.webkit:webkit:1.12.1")
}
