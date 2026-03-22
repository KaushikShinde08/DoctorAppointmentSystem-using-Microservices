package com.hospital.doctor.service.impl;

import com.hospital.doctor.dto.DoctorResponse;
import com.hospital.doctor.dto.SlotResponse;
import com.hospital.doctor.entity.Doctor;
import com.hospital.doctor.entity.Mode;
import com.hospital.doctor.entity.Slot;
import com.hospital.doctor.entity.Specialty;
import com.hospital.doctor.exception.ResourceNotFoundException;
import com.hospital.doctor.repository.DoctorRepository;
import com.hospital.doctor.repository.SlotRepository;
import com.hospital.doctor.repository.SpecialtyRepository;
import com.hospital.doctor.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class DoctorServiceImpl implements DoctorService {

    private final DoctorRepository doctorRepository;
    private final SpecialtyRepository specialtyRepository;
    private final SlotRepository slotRepository;

    @Override
    public List<Specialty> getAllSpecialties() {
        return specialtyRepository.findAll();
    }

    @Override
    public List<DoctorResponse> getDoctors(Long specialtyId, Mode mode) {

        List<Doctor> doctors;

        if (specialtyId != null && mode != null) {
            doctors = doctorRepository.findBySpecialty_IdAndMode(specialtyId, mode);
        }
        else if (specialtyId != null) {
            doctors = doctorRepository.findBySpecialty_Id(specialtyId);
        }
        else if (mode != null) {
            doctors = doctorRepository.findByMode(mode);
        }
        else {
            doctors = doctorRepository.findAll();
        }

        return doctors.stream()
                .map(this::mapDoctor)
                .toList();
    }

    @Override
    public DoctorResponse getDoctorById(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));

        return mapDoctor(doctor);
    }

    @Override
    public List<SlotResponse> getAvailableSlots(Long doctorId, LocalDate date) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new ResourceNotFoundException("Doctor not found"));
        List<Slot> slots =
                slotRepository.findByDoctor_IdAndSlotDateAndIsBookedFalse(doctorId, date);
        LocalDateTime now = LocalDateTime.now();

        List<SlotResponse> filteredSlots = slots.stream()
                .filter(slot -> {
                    if (slot.getSlotDate().isAfter(now.toLocalDate())) return true;
                    return slot.getStartTime().isAfter(now.toLocalTime());
                })
                .map(this::mapSlot)
                .toList();

        // FIX B6: Return empty list (200 OK) instead of 404.
        // 404 means "resource doesn't exist"; an empty slot list is a valid state for a real doctor.
        return filteredSlots;
    }

    @Override
    public SlotResponse getSlotById(Long slotId) {
        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        return mapSlot(slot);
    }

    @Override
    @Transactional
    public void bookSlot(Long slotId) {

        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));

        if (slot.isBooked()) {
            throw new IllegalStateException("Slot already booked");
        }

        slot.setBooked(true);

        slotRepository.save(slot);
    }

    @Override
    @Transactional
    public void releaseSlot(Long slotId) {

        Slot slot = slotRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found"));
        if(!slot.isBooked()){
            throw new RuntimeException("Slot already available");
        }

        slot.setBooked(false);

        slotRepository.save(slot);
    }

    private DoctorResponse mapDoctor(Doctor doctor) {

        DoctorResponse response = new DoctorResponse();

        response.setId(doctor.getId());
        response.setName(doctor.getName());
        response.setEmail(doctor.getEmail());
        response.setMode(doctor.getMode().name());
        response.setConsultationFee(doctor.getConsultationFee());
        response.setSpecialty(doctor.getSpecialty().getName());

        return response;
    }

    private SlotResponse mapSlot(Slot slot) {

        SlotResponse response = new SlotResponse();

        response.setId(slot.getId());
        response.setSlotDate(slot.getSlotDate());
        response.setStartTime(slot.getStartTime());
        response.setEndTime(slot.getEndTime());

        return response;
    }

}