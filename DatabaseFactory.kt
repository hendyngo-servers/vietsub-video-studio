package com.example.server.db

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SchemaUtils
import org.jetbrains.exposed.sql.transactions.experimental.newSuspendedTransaction
import org.jetbrains.exposed.sql.transactions.transaction

object DatabaseFactory {
    fun init(isProduction: Boolean = false) {
        if (isProduction) {
            val url = System.getenv("DB_URL") ?: "jdbc:postgresql://localhost:5432/vietsub_studio"
            val user = System.getenv("DB_USER") ?: "postgres"
            val password = System.getenv("DB_PASSWORD") ?: "secret"
            Database.connect(url = url, driver = "org.postgresql.Driver", user = user, password = password)
        } else {
            Database.connect(url = "jdbc:h2:./build/vietsub_db;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;", driver = "org.h2.Driver")
        }

        transaction {
            SchemaUtils.create(VideoJobsTable)
        }
    }

    suspend fun <T> dbQuery(block: suspend () -> T): T =
        newSuspendedTransaction(org.jetbrains.exposed.sql.transactions.TransactionManager.current().db) {
            block()
        }
}
