package com.hospital.Appointment.dto;

import com.hospital.Appointment.entity.AppointmentStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class StatusUpdateRequest {
    private AppointmentStatus status;

}
