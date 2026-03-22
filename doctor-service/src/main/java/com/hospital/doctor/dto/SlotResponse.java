package com.hospital.doctor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;


@Data
@AllArgsConstructor
@NoArgsConstructor
public class SlotResponse {

    private Long id;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;

}