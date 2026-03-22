package com.hospital.Appointment.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secretKey;

    // Validates the JWT and returns all claims (userId, role, email, etc.)
    public Claims extractClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // Helper: safely extract userId from token as a java.lang.Long
    public Long extractUserId(String token) {
        Number userId = extractClaims(token).get("userId", Number.class);
        return userId != null ? userId.longValue() : null;
    }

    // Helper: extract role from token
    public String extractRole(String token) {
        return extractClaims(token).get("role", String.class);
    }
}
