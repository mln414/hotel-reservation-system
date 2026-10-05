package com.lankastay.backend;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.sql.DriverManager;

import static org.junit.jupiter.api.Assertions.*;

/** Explicit opt-in only; never creates/drops databases or migrates the live database. */
@EnabledIfEnvironmentVariable(named = "MIGRATION_TEST_ALLOW_FRESH", matches = "true")
class MySqlMigrationIT {
    private Flyway flyway(String url) {
        return Flyway.configure().dataSource(url, System.getenv("MIGRATION_TEST_USER"),
                        System.getenv("MIGRATION_TEST_PASSWORD"))
                .locations("filesystem:src/main/resources/db/migration")
                .cleanDisabled(true).baselineOnMigrate(false).load();
    }

    @Test
    void existingLineageValidatesWithoutExecutingPendingMigrations() {
        Flyway existing = Flyway.configure()
                .dataSource(System.getenv("MIGRATION_EXISTING_URL"), System.getenv("MIGRATION_EXISTING_USER"),
                        System.getenv("MIGRATION_EXISTING_PASSWORD"))
                .locations("filesystem:src/main/resources/db/migration")
                .ignoreMigrationPatterns("*:pending", "*:future")
                .cleanDisabled(true).load();
        existing.validate();
        assertEquals("18", existing.info().current().getVersion().getVersion());
    }

    @Test
    void emptyIsolatedMySqlMigratesFromB18ThroughV19AndRestartIsIdempotent() throws Exception {
        String url = System.getenv("MIGRATION_TEST_URL");
        assertTrue(url != null && url.startsWith("jdbc:mysql://127.0.0.1:")
                && !url.startsWith("jdbc:mysql://127.0.0.1:3306/")
                && url.contains("/lankastay_precommit_fresh"), "Refusing a non-isolated target");
        try (var connection = DriverManager.getConnection(url, System.getenv("MIGRATION_TEST_USER"),
                System.getenv("MIGRATION_TEST_PASSWORD")); var statement = connection.createStatement()) {
            try (var rows = statement.executeQuery("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE()")) {
                rows.next(); assertEquals(0, rows.getInt(1), "Fresh test requires an empty database");
            }
        }
        Flyway fresh = flyway(url);
        assertEquals(2, fresh.migrate().migrationsExecuted);
        fresh.validate();
        assertEquals("19", fresh.info().current().getVersion().getVersion());
        assertEquals(0, fresh.migrate().migrationsExecuted);
        try (var connection = DriverManager.getConnection(url, System.getenv("MIGRATION_TEST_USER"),
                System.getenv("MIGRATION_TEST_PASSWORD")); var statement = connection.createStatement()) {
            for (String table : new String[]{"customer_users", "staff_users"}) {
                try (var rows = statement.executeQuery("SELECT COUNT(*) FROM " + table)) {
                    rows.next(); assertEquals(0, rows.getInt(1), "Baseline must contain no account data");
                }
            }
            try (var rows = statement.executeQuery("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='customer_users' AND column_name='session_version'")) {
                rows.next(); assertEquals(1, rows.getInt(1));
            }
        }
    }
}
