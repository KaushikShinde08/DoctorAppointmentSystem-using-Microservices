package com.hospital.Appointment.service.impl;


import com.hospital.Appointment.client.DoctorClient;
import com.hospital.Appointment.dto.DoctorResponse;
import com.hospital.Appointment.dto.AppointmentRequest;
import com.hospital.Appointment.dto.AppointmentResponse;
import com.hospital.Appointment.entity.Appointment;
import com.hospital.Appointment.entity.AppointmentStatus;
import com.hospital.Appointment.exception.ResourceNotFoundException;
import com.hospital.Appointment.repository.AppointmentRepository;
import com.hospital.Appointment.service.AppointmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppointmentServiceImpl implements AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorClient doctorClient;


    @Value("${internal.secret}")
    private String internalSecret;

    @Override
    @Transactional
    public AppointmentResponse bookAppointment(AppointmentRequest request, Long patientId) {

        DoctorResponse doctorInfo = doctorClient.getDoctor(request.getDoctorId());

        if (!doctorInfo.getMode().equals(request.getMode().name())) {
            throw new IllegalStateException("Doctor does not support the requested mode: " + request.getMode());
        }

        doctorClient.bookSlot(request.getSlotId(), internalSecret);

        try {
            Appointment appointment = new Appointment();

            appointment.setDoctorId(request.getDoctorId());
            appointment.setPatientId(patientId);
            appointment.setSlotId(request.getSlotId());
            appointment.setMode(request.getMode());
            appointment.setStatus(AppointmentStatus.BOOKED);
            appointment.setPrice(doctorInfo.getConsultationFee());

            Appointment saved = appointmentRepository.save(appointment);

            return map(saved);
        } catch (Exception e) {
            doctorClient.releaseSlot(request.getSlotId(), internalSecret);
            throw new IllegalStateException("Failed to save appointment. Slot was released.", e);
        }
    }

    @Override
    public List<AppointmentResponse> getPatientAppointments(Long patientId) {

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    public List<AppointmentResponse> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    @Override
    @Transactional
    public void cancelAppointment(Long appointmentId, Long userId, String role) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        // Ownership and status checks are performed below

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Appointment already cancelled");
        }
        if (!"ADMIN".equals(role) && !appointment.getPatientId().equals(userId)) {
            throw new com.hospital.Appointment.exception.AccessDeniedException("You can only cancel your own appointments");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        appointmentRepository.save(appointment);

        doctorClient.releaseSlot(appointment.getSlotId(), internalSecret);
    }

    @Override
    @Transactional
    public void updateStatus(Long appointmentId, AppointmentStatus status) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Cannot update cancelled appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalStateException("Appointment already completed");
        }

        appointment.setStatus(status);

        appointmentRepository.save(appointment);
    }



    private AppointmentResponse map(Appointment appointment) {

        AppointmentResponse response = new AppointmentResponse();

        response.setId(appointment.getId());
        response.setDoctorId(appointment.getDoctorId());
        response.setPatientId(appointment.getPatientId());
        response.setSlotId(appointment.getSlotId());
        response.setMode(appointment.getMode().name());
        response.setStatus(appointment.getStatus().name());
        response.setPrice(appointment.getPrice());

        try {
            DoctorResponse doctorInfo = doctorClient.getDoctor(appointment.getDoctorId());
            response.setDoctorName(doctorInfo.getName());
        } catch (Exception e) {
            response.setDoctorName("Unknown Doctor");
        }

        try {
            com.hospital.Appointment.dto.SlotResponse slotInfo = doctorClient.getSlot(appointment.getSlotId(), internalSecret);
            response.setSlotDate(slotInfo.getSlotDate());
            response.setStartTime(slotInfo.getStartTime());
            response.setEndTime(slotInfo.getEndTime());
        } catch (Exception e) {
            // Ignored, defaults to null
        }

        return response;
    }
}
