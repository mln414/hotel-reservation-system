package com.lankastay.backend;

import com.lankastay.backend.exception.ApiException;
import com.lankastay.backend.service.PasswordPolicy;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class PasswordPolicyTest {
    private final PasswordPolicy policy = new PasswordPolicy();

    @Test
    void acceptsMinimumAndMaximumLengthPasswords() {
        assertDoesNotThrow(() -> policy.validate("Aa1!bbbb"));
        assertDoesNotThrow(() -> policy.validate("Aa1!" + "b".repeat(124)));
    }

    @Test
    void rejectsNullEmptyAndOutOfRangePasswords() {
        assertThrows(ApiException.class, () -> policy.validate(null));
        assertThrows(ApiException.class, () -> policy.validate(""));
        assertThrows(ApiException.class, () -> policy.validate("Aa1!bbb"));
        assertThrows(ApiException.class, () -> policy.validate("Aa1!" + "b".repeat(125)));
    }

    @Test
    void enforcesEveryComplexityRule() {
        assertThrows(ApiException.class, () -> policy.validate("lowercase1!"));
        assertThrows(ApiException.class, () -> policy.validate("UPPERCASE1!"));
        assertThrows(ApiException.class, () -> policy.validate("NoNumber!"));
        assertThrows(ApiException.class, () -> policy.validate("NoSpecial1"));
    }
}
