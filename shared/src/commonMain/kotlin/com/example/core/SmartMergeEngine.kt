package com.example.app.ui.timeline

import com.example.core.model.SubtitleItem

object SmartMergeEngine {
    fun mergeShortSubtitles(
        subtitles: List<SubtitleItem>,
        minDurationMs: Long = 1500,
        maxCharLength: Int = 42
    ): List<SubtitleItem> {
        if (subtitles.isEmpty()) return emptyList()

        val result = mutableListOf<SubtitleItem>()
        var current = subtitles.first()

        for (i in 1 until subtitles.size) {
            val next = subtitles[i]
            val currentDuration = current.endMs - current.startMs
            val combinedText = "${current.text} ${next.text}".trim()

            if (currentDuration < minDurationMs && combinedText.length <= maxCharLength) {
                current = current.copy(
                    endMs = next.endMs,
                    text = combinedText
                )
            } else {
                result.add(current)
                current = next
            }
        }
        result.add(current)
        return result
    }
}
