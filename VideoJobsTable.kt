package com.example.server.db

import org.jetbrains.exposed.sql.Table

enum class JobStatus {
    PENDING, EXTRACTING, TRANSLATING, RENDERING, COMPLETED, FAILED
}

object VideoJobsTable : Table("video_jobs") {
    val jobId = varchar("job_id", 36)
    val status = enumerationByName("status", 20, JobStatus::class)
    val progress = integer("progress").default(0)
    val inputPath = varchar("input_path", 512).nullable()
    val outputPath = varchar("output_path", 512).nullable()
    val errorMessage = text("error_message").nullable()
    val createdAt = long("created_at")

    override val primaryKey = PrimaryKey(jobId)
}

data class VideoJobDto(
    val jobId: String,
    val status: JobStatus,
    val progress: Int,
    val inputPath: String?,
    val outputPath: String?,
    val errorMessage: String?,
    val createdAt: Long
)
