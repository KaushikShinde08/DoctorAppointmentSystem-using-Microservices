package com.hospital.Appointment.dto;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class DoctorResponse {

    private Long id;
    private String name;
    private String specialty;
    private String mode;
    private Integer consultationFee;
}