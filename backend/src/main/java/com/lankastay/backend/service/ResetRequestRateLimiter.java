package com.lankastay.backend.service;

import org.springframework.stereotype.Component;
import java.time.Instant;
import java.util.*;

@Component
public class ResetRequestRateLimiter {
    private final Map<String, Deque<Instant>> attempts = new LinkedHashMap<>(16, .75f, true);
    public synchronized boolean allow(String ip) {
        Instant cutoff = Instant.now().minusSeconds(900);
        attempts.values().forEach(queue -> { while (!queue.isEmpty() && !queue.peekFirst().isAfter(cutoff)) queue.removeFirst(); });
        attempts.entrySet().removeIf(entry -> entry.getValue().isEmpty());
        String key = ip == null ? "unknown" : ip;
        if (!attempts.containsKey(key) && attempts.size() >= 10000) return false;
        Deque<Instant> queue = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        if (queue.size() >= 5) return false;
        queue.addLast(Instant.now());
        return true;
    }
}
