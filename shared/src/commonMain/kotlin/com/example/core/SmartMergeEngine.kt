package com.example.app.ui.timeline

import com.example.core.model.SubtitleItem

object SmartMergeEngine {
    data class Config(
        val maxGapMs: Long = 600L,
        val minDurationMs: Long = 1200L,
        val maxDurationMs: Long = 5000L
    )

    fun process(items: List<SubtitleItem>, config: Config = Config()): List<SubtitleItem> {
        if (items.isEmpty()) return emptyList()

        val merged = mutableListOf<SubtitleItem>()
        var current = items.first()

        for (i in 1 until items.size) {
            val next = items[i]
            val gap = next.startMs - current.endMs
            val currentDuration = current.endMs - current.startMs
            val combinedDuration = next.endMs - current.startMs

            val isCurrentTooShort = currentDuration < config.minDurationMs
            val isGapSmall = gap <= config.maxGapMs
            val isWithinMaxDuration = combinedDuration <= config.maxDurationMs
            val hasTerminalPunctuation = current.text.endsWith(".") || current.text.endsWith("?") || current.text.endsWith("!")

            val shouldMerge = (isCurrentTooShort && isGapSmall && isWithinMaxDuration) || 
                              (!hasTerminalPunctuation && isGapSmall && isWithinMaxDuration)

            if (shouldMerge) {
                current = current.copy(
                    endMs = next.endMs,
                    text = "${current.text} ${next.text}"
                )
            } else {
                merged.add(current)
                current = next
            }
        }
        merged.add(current)

        return merged.mapIndexed { index, item -> item.copy(id = index + 1) }
    }
}
