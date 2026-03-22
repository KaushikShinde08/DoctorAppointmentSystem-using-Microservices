package com.hospital.Appointment.service;

import com.hospital.Appointment.dto.AppointmentRequest;
import com.hospital.Appointment.dto.AppointmentResponse;
import com.hospital.Appointment.entity.AppointmentStatus;

import java.util.List;

public interface AppointmentService {
    AppointmentResponse bookAppointment(AppointmentRequest request, Long patientId);
    List<AppointmentResponse> getPatientAppointments(Long patientId);
    void cancelAppointment(Long appointmentId, Long userId, String role);
    void updateStatus(Long appointmentId, AppointmentStatus status);
    List<AppointmentResponse> getAllAppointments();

}
