package com.hospital.Appointment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentResponse {

    private Long id;
    private Long patientId;
    private Long doctorId;
    private String doctorName;
    private Long slotId;
    private java.time.LocalDate slotDate;
    private java.time.LocalTime startTime;
    private java.time.LocalTime endTime;
    private String mode;
    private String status;
    private Integer price;  // Added to return the consultation fee to the frontend

}