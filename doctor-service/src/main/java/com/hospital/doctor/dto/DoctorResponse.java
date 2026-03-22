package com.hospital.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class DoctorResponse {

    private Long id;
    private String name;
    private String email;
    private String specialty;
    private String mode;
    private Integer consultationFee;

}