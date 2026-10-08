package com.example.app

import androidx.compose.material.MaterialTheme
import androidx.compose.runtime.Composable
import com.example.app.navigation.AppNavigation

@Composable
fun App() {
    MaterialTheme {
        AppNavigation()
    }
}
