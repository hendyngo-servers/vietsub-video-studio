plugins {
    alias(libs.plugins.kotlinMultiplatform)
    alias(libs.plugins.jetbrainsCompose)
    alias(libs.plugins.compose.compiler)
}

kotlin {
    jvm("desktop")
    sourceSets {
        val desktopMain by getting {
            dependencies {
                implementation(project(":composeApp"))
                implementation(libs.kotlinx.coroutines.swing)
            }
        }
    }
}

compose.desktop {
    application {
        mainClass = "com.example.app.MainKt"
        nativeDistributions {
            targetFormats(
                org.jetbrains.compose.desktop.application.dsl.TargetFormat.Dmg,
                org.jetbrains.compose.desktop.application.dsl.TargetFormat.Msi,
                org.jetbrains.compose.desktop.application.dsl.TargetFormat.Deb
            )
            packageName = "Vietsub Studio Pro"
            packageVersion = "2.4.0"
            description = "AI Subtitle Studio & Video Renderer Multiplatform"
            vendor = "Hendy Studio"

            macOS {
                iconFile.set(project.file("packaging/macos/icon.icns"))
                bundleID = "com.example.vietsubstudio"
            }
            windows {
                iconFile.set(project.file("packaging/windows/icon.ico"))
                menuGroup = "Vietsub Studio"
                upgradeUuid = "a1b2c3d4-e5f6-7890-1234-56789abcdef0"
            }
            linux {
                iconFile.set(project.file("packaging/linux/icon.png"))
            }
        }
    }
}
