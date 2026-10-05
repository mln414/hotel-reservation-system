package com.lankastay.backend;

import com.lankastay.backend.dto.auth.CustomerRegisterRequest;
import com.lankastay.backend.entity.CustomerUser;
import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.repository.CustomerUserRepository;
import com.lankastay.backend.service.CustomerAuthenticationService;
import com.lankastay.backend.service.PasswordPolicy;
import com.lankastay.backend.service.SecurityAuditService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CustomerAuthenticationServiceUnitTest {
    @Mock CustomerUserRepository customerRepository;
    @Mock PasswordEncoder encoder;
    @Mock PasswordPolicy passwordPolicy;
    @Mock SecurityAuditService audit;
    @InjectMocks CustomerAuthenticationService service;

    @Test
    void registerValidatesAndHashesPasswordWithoutChangingItsValue() {
        String password = "ValidPass1!";
        when(customerRepository.existsByEmail("guest@example.com")).thenReturn(false);
        when(encoder.encode(password)).thenReturn("encoded");
        when(customerRepository.save(any(CustomerUser.class))).thenAnswer(invocation -> {
            CustomerUser saved = invocation.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        var response = service.register(new CustomerRegisterRequest(" Test ", " Guest ", " Guest@Example.com ", null, password), "127.0.0.1");

        verify(passwordPolicy).validate(password);
        verify(encoder).encode(password);
        assertEquals("guest@example.com", response.email());
        assertEquals("CUSTOMER", response.role());
    }

    @Test
    void duplicateEmailStopsBeforePasswordProcessingOrPersistence() {
        when(customerRepository.existsByEmail("guest@example.com")).thenReturn(true);

        assertThrows(ApiException.class, () -> service.register(
                new CustomerRegisterRequest("Test", "Guest", "guest@example.com", null, "ValidPass1!"), "127.0.0.1"));

        verify(passwordPolicy, never()).validate(any());
        verify(encoder, never()).encode(any());
        verify(customerRepository, never()).save(any());
    }
}
