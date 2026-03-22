package com.hospital.api_gateway.filter;

import com.hospital.api_gateway.util.JwtUtil;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        if (path.startsWith("/auth")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            sendUnauthorized(response, "Missing or invalid Authorization header");
            return;
        }

        String token = header.substring(7);

        try {
            Claims claims = jwtUtil.validateToken(token);
            String username = claims.getSubject();
            String email = claims.getSubject(); // Usually the subject is the email
            String role = claims.get("role", String.class); // Get the custom "role" claim
            Long userId = claims.get("userId", Long.class); // Get the custom "userId" claim

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(username, null, new ArrayList<>());
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }

            // Apply path-based authorization rules for hackathon simplicity
            if (path.contains("/admin/") && !"ADMIN".equals(role)) {
                sendUnauthorized(response, "Access Denied: You must be an ADMIN to access this route");
                return;
            }

            // 3. Now 'role' and 'email' are valid variables!
            HttpServletRequest wrappedRequest = new HttpServletRequestWrapper(request) {
                @Override
                public String getHeader(String name) {
                    if ("X-User-Role".equals(name)) return role;
                    if ("X-User-Email".equals(name)) return email;
                    if ("X-User-Id".equals(name)) return userId != null ? String.valueOf(userId) : null;
                    return super.getHeader(name);
                }
            };

            filterChain.doFilter(wrappedRequest, response);
        } catch (Exception e) {
            sendUnauthorized(response, "Invalid or expired JWT token");
        }
    }

    private void sendUnauthorized(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"Unauthorized\", \"message\": \"" + message + "\"}");
    }
}