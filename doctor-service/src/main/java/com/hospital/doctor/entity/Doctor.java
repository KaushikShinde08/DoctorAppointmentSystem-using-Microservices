package com.hospital.doctor.entity;


import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Table(name = "doctor")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String email;

    @ManyToOne
    @JoinColumn(name = "specialty_id")
    private Specialty specialty;

    @Enumerated(EnumType.STRING)
    private Mode mode;
    private Integer consultationFee;
    private LocalDateTime createdAt = LocalDateTime.now();
}
