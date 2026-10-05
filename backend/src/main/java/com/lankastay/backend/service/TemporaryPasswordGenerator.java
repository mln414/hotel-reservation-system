package com.lankastay.backend.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;

@Component
public class TemporaryPasswordGenerator {
    private static final char[] UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ".toCharArray();
    private static final char[] LOWER = "abcdefghijkmnopqrstuvwxyz".toCharArray();
    private static final char[] DIGITS = "23456789".toCharArray();
    private static final char[] SPECIAL = "!@#$%*-_".toCharArray();
    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*-_".toCharArray();
    private final SecureRandom random = new SecureRandom();

    public String generate() {
        char[] value = new char[20];
        value[0] = pick(UPPER);
        value[1] = pick(LOWER);
        value[2] = pick(DIGITS);
        value[3] = pick(SPECIAL);
        for (int i = 4; i < value.length; i++) value[i] = pick(ALPHABET);
        for (int i = value.length - 1; i > 0; i--) {
            int swap = random.nextInt(i + 1);
            char current = value[i];
            value[i] = value[swap];
            value[swap] = current;
        }
        return new String(value);
    }

    private char pick(char[] characters) {
        return characters[random.nextInt(characters.length)];
    }
}
