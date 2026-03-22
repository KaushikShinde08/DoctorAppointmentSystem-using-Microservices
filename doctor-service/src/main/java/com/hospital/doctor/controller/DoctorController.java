package com.hospital.doctor.controller;

import com.hospital.doctor.dto.DoctorResponse;
import com.hospital.doctor.dto.SlotResponse;
import com.hospital.doctor.entity.Mode;
import com.hospital.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final DoctorService doctorService;

    @GetMapping
    public ResponseEntity<List<DoctorResponse>> getDoctors(
            @RequestParam(required = false) Long specialtyId,
            @RequestParam(required = false) Mode mode
    ) {
        return ResponseEntity.ok(
                doctorService.getDoctors(specialtyId, mode)
        );
    }

    @GetMapping("/{doctorId}")
    public ResponseEntity<DoctorResponse> getDoctor(@PathVariable Long doctorId) {
        return ResponseEntity.ok(doctorService.getDoctorById(doctorId));
    }

    @GetMapping("/{doctorId}/slots")
    public ResponseEntity<List<SlotResponse>> getSlots(
            @PathVariable Long doctorId, @RequestParam LocalDate date){
        return ResponseEntity.ok(doctorService.getAvailableSlots(doctorId, date));
    }
}
