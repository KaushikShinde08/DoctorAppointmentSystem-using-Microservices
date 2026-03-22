package com.hospital.doctor.entity;


import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "slots", uniqueConstraints = {
        @UniqueConstraint(
                columnNames = {"doctorId", "slotDate", "startTime", "endTime"}
        )
    }
)
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Slot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "doctor_id")
    @JsonIgnore
    private Doctor doctor;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private boolean isBooked = false;

    @Version
    private Long version;
}
