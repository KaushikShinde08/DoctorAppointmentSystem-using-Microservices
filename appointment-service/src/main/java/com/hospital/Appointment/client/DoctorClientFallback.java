package com.hospital.Appointment.client;

import com.hospital.Appointment.dto.DoctorResponse;
import org.springframework.stereotype.Component;

@Component
public class DoctorClientFallback implements DoctorClient {

    // FIX (lint): Updated signatures to match DoctorClient interface (Long slotId, String secret).
    // The 'secret' param is a Feign transport concern and is ignored in the fallback.

    @Override
    public void bookSlot(Long slotId, String secret) {
        throw new IllegalStateException("Doctor Service is unavailable. Cannot book slot " + slotId + ". Please try again later.");
    }

    @Override
    public void releaseSlot(Long slotId, String secret) {
        // Must throw — if we swallow the error, the appointment is marked CANCELLED in DB
        // but the slot stays permanently booked (data inconsistency).
        // Throwing causes the @Transactional cancelAppointment to roll back, keeping state consistent.
        throw new IllegalStateException(
            "Doctor Service is unavailable. Cannot release slot " + slotId +
            ". Cancellation aborted to prevent data inconsistency. Please try again later."
        );
    }

    @Override
    public DoctorResponse getDoctor(Long doctorId) {
        throw new IllegalStateException("Doctor Service is unavailable. Cannot verify doctor details.");
    }

    @Override
    public com.hospital.Appointment.dto.SlotResponse getSlot(Long slotId, String secret) {
        throw new IllegalStateException("Doctor Service is unavailable. Cannot fetch slot details.");
    }
}
