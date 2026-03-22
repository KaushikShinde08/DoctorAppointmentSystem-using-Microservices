package com.hospital.doctor.controller;

import com.hospital.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/slots")
@RequiredArgsConstructor
public class SlotController {

    private final DoctorService doctorService;

    // The internal secret must match what the appointment-service sends.
    // This prevents external clients from directly calling book/release endpoints.
    @Value("${internal.secret}")
    private String internalSecret;

    // ── Internal: Get Slot Details ────────────────────────────────────────────
    @GetMapping("/{slotId}")
    public ResponseEntity<?> getSlotDetails(
            @PathVariable Long slotId,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {

        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: internal endpoints only");
        }
        return ResponseEntity.ok(doctorService.getSlotById(slotId));
    }

    // ── Internal: Book Slot ───────────────────────────────────────────────────
    // Called ONLY by the appointment-service via Feign. Not meant for public access.
    // FIX B5: Validate X-Internal-Secret header to block external callers.
    @PostMapping("/{slotId}/book")
    public ResponseEntity<String> bookSlot(
            @PathVariable Long slotId,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {

        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: internal endpoints only");
        }

        doctorService.bookSlot(slotId);
        return ResponseEntity.ok("Slot booked");
    }

    // ── Internal: Release Slot ────────────────────────────────────────────────
    // Called ONLY by the appointment-service via Feign when appointment is cancelled.
    // FIX B5: Same internal secret guard.
    @PostMapping("/{slotId}/release")
    public ResponseEntity<String> releaseSlot(
            @PathVariable Long slotId,
            @RequestHeader(value = "X-Internal-Secret", required = false) String secret) {

        if (!internalSecret.equals(secret)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Access denied: internal endpoints only");
        }

        doctorService.releaseSlot(slotId);
        return ResponseEntity.ok("Slot released");
    }
}