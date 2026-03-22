package com.hospital.doctor.service;

import com.hospital.doctor.dto.DoctorResponse;
import com.hospital.doctor.dto.SlotResponse;
import com.hospital.doctor.entity.Specialty;
import com.hospital.doctor.entity.Mode;

import java.time.LocalDate;
import java.util.List;

public interface DoctorService {
    List<Specialty> getAllSpecialties();
    List<DoctorResponse> getDoctors(Long specialtyId, Mode mode);
    DoctorResponse getDoctorById(Long doctorId);
    List<SlotResponse> getAvailableSlots(Long doctorId, LocalDate date);
    SlotResponse getSlotById(Long slotId);
    void bookSlot(Long slotId);
    void releaseSlot(Long slotId);

}
