package com.hospital.Appointment.controller;

import com.hospital.Appointment.dto.AppointmentRequest;
import com.hospital.Appointment.dto.AppointmentResponse;
import com.hospital.Appointment.entity.AppointmentStatus;
import com.hospital.Appointment.exception.AccessDeniedException;
import com.hospital.Appointment.service.AppointmentService;
import com.hospital.Appointment.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
//import org.springframework.security.access.prepost.PreAuthorize;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AppointmentController {

    private final AppointmentService appointmentService;
    private final JwtUtil jwtUtil;

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponse> book(
            @Valid @RequestBody AppointmentRequest request,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long patientId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(appointmentService.bookAppointment(request, patientId));
    }

    // ── Get Patient Appointments ──────────────────────────────────────────────
    // FIX B4: IDOR vulnerability — a patient must only see their own appointments.
    // An ADMIN may view any patient's appointments.
    @GetMapping("/appointments/patient/{patientId}")
//    @PreAuthorize("hasRole('ADMIN') or #patientId == authentication.principal.userId")
    public ResponseEntity<List<AppointmentResponse>> getPatientAppointments(
            @PathVariable Long patientId,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        Long jwtUserId = jwtUtil.extractUserId(token);
        String role    = jwtUtil.extractRole(token);

        // Only allow if the requester is ADMIN or is the patient themselves
        if (!"ADMIN".equals(role) && !jwtUserId.equals(patientId)) {
            throw new AccessDeniedException("You can only view your own appointments");
        }

        return ResponseEntity.ok(appointmentService.getPatientAppointments(patientId));
    }

    // ── Cancel Appointment ────────────────────────────────────────────────────
    // Patients can only cancel their own appointments; ADMINs can cancel any.
    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<String> cancel(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable Long id) {

        String token  = authHeader.substring(7);
        Long   userId = jwtUtil.extractUserId(token);
        String role   = jwtUtil.extractRole(token);

        appointmentService.cancelAppointment(id, userId, role);
        return ResponseEntity.ok("Appointment cancelled successfully");
    }

    @GetMapping("/admin/appointments")
    public ResponseEntity<List<AppointmentResponse>> getAllAppointments(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String role  = jwtUtil.extractRole(token);

        if (!"ADMIN".equals(role)) {
            throw new AccessDeniedException("Only ADMIN can view all appointments");
        }

        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    @PatchMapping("/admin/appointments/{id}/status")
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody AppointmentStatus status,
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.substring(7);
        String role  = jwtUtil.extractRole(token);

        if (!"ADMIN".equals(role)) {
            throw new AccessDeniedException("Only ADMIN can update appointment status");
        }

        appointmentService.updateStatus(id, status);
        return ResponseEntity.ok("Status updated to: " + status);
    }
}
