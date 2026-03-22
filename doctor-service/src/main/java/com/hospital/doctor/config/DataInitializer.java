package com.hospital.doctor.config;


import com.hospital.doctor.entity.Doctor;
import com.hospital.doctor.entity.Mode;
import com.hospital.doctor.entity.Slot;
import com.hospital.doctor.entity.Specialty;
import com.hospital.doctor.repository.DoctorRepository;
import com.hospital.doctor.repository.SlotRepository;
import com.hospital.doctor.repository.SpecialtyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final SpecialtyRepository specialtyRepository;
    private final DoctorRepository doctorRepository;
    private final SlotRepository slotRepository;

    @Override
    public void run(String... args) {

        if (doctorRepository.count() > 0) {
            System.out.println("Doctors already exist. Skipping seed.");
            return;
        }

        System.out.println("Seeding doctors and slots...");

        // Specialties
        Specialty cardiology = specialtyRepository.save(new Specialty(null,"Cardiology"));
        Specialty dermatology = specialtyRepository.save(new Specialty(null,"Dermatology"));
        Specialty neurology = specialtyRepository.save(new Specialty(null,"Neurology"));
        Specialty orthopedics = specialtyRepository.save(new Specialty(null,"Orthopedics"));
        Specialty pediatrics = specialtyRepository.save(new Specialty(null,"Pediatrics"));

        List<Doctor> doctors = new ArrayList<>();

        // 1. Dr. Sharma (Cardiology, ONLINE)
        Doctor d1 = new Doctor();
        d1.setName("Dr. Sharma");
        d1.setEmail("sharma@hospital.com");
        d1.setSpecialty(cardiology);
        d1.setMode(Mode.ONLINE);
        d1.setConsultationFee(500);
        doctors.add(d1);

        // 2. Dr. Rao (Cardiology, OFFLINE)
        Doctor d2 = new Doctor();
        d2.setName("Dr. Rao");
        d2.setEmail("rao@hospital.com");
        d2.setSpecialty(cardiology);
        d2.setMode(Mode.OFFLINE);
        d2.setConsultationFee(800);
        doctors.add(d2);

        // 3. Dr. Verma (Neurology, ONLINE)
        Doctor d3 = new Doctor();
        d3.setName("Dr. Verma");
        d3.setEmail("verma@hospital.com");
        d3.setSpecialty(neurology);
        d3.setMode(Mode.ONLINE);
        d3.setConsultationFee(600);
        doctors.add(d3);

        // 4. Dr. Iyer (Dermatology, OFFLINE)
        Doctor d4 = new Doctor();
        d4.setName("Dr. Iyer");
        d4.setEmail("iyer@hospital.com");
        d4.setSpecialty(dermatology);
        d4.setMode(Mode.OFFLINE);
        d4.setConsultationFee(400);
        doctors.add(d4);

        // 5. Dr. Patel (Orthopedics, OFFLINE)
        Doctor d5 = new Doctor();
        d5.setName("Dr. Patel");
        d5.setEmail("patel@hospital.com");
        d5.setSpecialty(orthopedics);
        d5.setMode(Mode.OFFLINE);
        d5.setConsultationFee(700);
        doctors.add(d5);

        // 6. Dr. Singh (Pediatrics, ONLINE)
        Doctor d6 = new Doctor();
        d6.setName("Dr. Singh");
        d6.setEmail("singh@hospital.com");
        d6.setSpecialty(pediatrics);
        d6.setMode(Mode.ONLINE);
        d6.setConsultationFee(300);
        doctors.add(d6);

        doctorRepository.saveAll(doctors);

        List<Slot> slots = new ArrayList<>();

        for (int i = 0; i < 5; i++) {

            LocalDate date = LocalDate.now().plusDays(i);

            // Doctor 1
            slots.add(createSlot(d1, date, LocalTime.of(10,0), LocalTime.of(10,30)));
            slots.add(createSlot(d1, date, LocalTime.of(10,30), LocalTime.of(11,0)));
            slots.add(createSlot(d1, date, LocalTime.of(11,0), LocalTime.of(11,30)));

            // Doctor 2
            slots.add(createSlot(d2, date, LocalTime.of(14,0), LocalTime.of(14,30)));
            slots.add(createSlot(d2, date, LocalTime.of(14,30), LocalTime.of(15,0)));

            // Doctor 3
            slots.add(createSlot(d3, date, LocalTime.of(10,0), LocalTime.of(10,30)));
            slots.add(createSlot(d3, date, LocalTime.of(10,30), LocalTime.of(11,0)));

            // Doctor 4
            slots.add(createSlot(d4, date, LocalTime.of(9,0), LocalTime.of(9,30)));
            slots.add(createSlot(d4, date, LocalTime.of(9,30), LocalTime.of(10,0)));

            // Doctor 5
            slots.add(createSlot(d5, date, LocalTime.of(16,0), LocalTime.of(16,45)));

            // Doctor 6
            slots.add(createSlot(d6, date, LocalTime.of(11,0), LocalTime.of(11,30)));
            slots.add(createSlot(d6, date, LocalTime.of(11,30), LocalTime.of(12,0)));
        }

        slotRepository.saveAll(slots);

        System.out.println("Doctors and slots seeded successfully.");
    }

    private Slot createSlot(Doctor doctor, LocalDate date, LocalTime start, LocalTime end) {

        Slot slot = new Slot();

        slot.setDoctor(doctor);
        slot.setSlotDate(date);
        slot.setStartTime(start);
        slot.setEndTime(end);
        slot.setBooked(false);

        return slot;
    }
}