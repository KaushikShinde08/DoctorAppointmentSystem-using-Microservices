package com.hospital.doctor.entity;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table (name = "specialties")
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class Specialty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
}
