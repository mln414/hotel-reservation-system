package com.lankastay.backend;

import com.lankastay.backend.config.SeedDataInitializer;
import com.lankastay.backend.repository.DestinationRepository;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.env.StandardEnvironment;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class SeedDataInitializerTest {
    @Test
    void defaultStartupDoesNotCreateCompletedDemoReservations() {
        DestinationRepository destinations = mock(DestinationRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(destinations.count()).thenReturn(9L);
        when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        new SeedDataInitializer(destinations, jdbc, false, new StandardEnvironment()).run();
        verify(jdbc, never()).queryForObject(contains("DEMO-REVIEW-001"), eq(Integer.class));
        verify(jdbc, never()).update(contains("DEMO-REVIEW-001"), any(Object[].class));
    }

    @Test
    void explicitOptInPreservesDemoCapabilityWithoutDuplicatingExistingReservation() {
        DestinationRepository destinations = mock(DestinationRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(destinations.count()).thenReturn(9L);
        when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("dev");
        new SeedDataInitializer(destinations, jdbc, true, environment).run();
        verify(jdbc).queryForObject(contains("DEMO-REVIEW-001"), eq(Integer.class));
        verify(jdbc, never()).update(contains("DEMO-REVIEW-001"), any(Object[].class));
    }

    @Test
    void explicitFlagAloneCannotEnableDemoOnDefaultProfile() {
        assertDemoDisabled(new StandardEnvironment());
    }

    @Test
    void productionProfilePreventsDemoEvenWithDevAndExplicitFlag() {
        StandardEnvironment environment = new StandardEnvironment();
        environment.setActiveProfiles("dev", "prod");
        assertDemoDisabled(environment);
    }

    private void assertDemoDisabled(StandardEnvironment environment) {
        DestinationRepository destinations = mock(DestinationRepository.class);
        JdbcTemplate jdbc = mock(JdbcTemplate.class);
        when(destinations.count()).thenReturn(9L);
        when(jdbc.queryForObject(anyString(), eq(Integer.class))).thenReturn(1);
        new SeedDataInitializer(destinations, jdbc, true, environment).run();
        verify(jdbc, never()).queryForObject(contains("DEMO-REVIEW-001"), eq(Integer.class));
    }
}
