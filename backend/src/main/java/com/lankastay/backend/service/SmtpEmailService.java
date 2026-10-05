package com.lankastay.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Profile("!dev")
@org.springframework.scheduling.annotation.EnableAsync
public class SmtpEmailService implements EmailService {
    private final JavaMailSender sender;
    private final String from;
    public SmtpEmailService(org.springframework.beans.factory.ObjectProvider<JavaMailSender> sender, @Value("${lankastay.mail.from:noreply@lankastay.local}") String from) {
        this.sender = sender.getIfAvailable();
        this.from = from;
    }
    @org.springframework.scheduling.annotation.Async
    public void sendPasswordReset(String email, String resetUrl) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("LankaStay password reset");
        message.setText("Reset your password within 30 minutes: " + resetUrl + "\nIf you did not request this, ignore this email.");
        try {
            if (sender == null) throw new IllegalStateException("SMTP is not configured.");
            sender.send(message);
        }
        catch (RuntimeException failure) {
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Password reset delivery unavailable; check private SMTP configuration.");
        }
    }
}
