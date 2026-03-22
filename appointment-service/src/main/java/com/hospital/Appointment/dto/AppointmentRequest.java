package com.hospital.Appointment.dto;

import com.hospital.Appointment.entity.Mode;
import lombok.*;
import jakarta.validation.constraints.NotNull;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AppointmentRequest {

//    @NotNull(message = "Patient ID is required")
//    private Long patientId;
    @NotNull(message = "Doctor ID is required")
    private Long doctorId;
    @NotNull(message = "Slot ID is required")
    private Long slotId;
    @NotNull(message = "Mode is required")
    private Mode mode;

}
