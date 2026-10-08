package com.example.app

import kotlinx.browser.window

external interface TelegramWebApp {
    val initData: String
    val initDataUnsafe: dynamic
    fun ready()
    fun expand()
    fun close()
}

object TelegramSdk {
    val webApp: TelegramWebApp?
        get() = window.asDynamic().Telegram?.WebApp as? TelegramWebApp

    fun init() {
        webApp?.ready()
        webApp?.expand()
    }
}
