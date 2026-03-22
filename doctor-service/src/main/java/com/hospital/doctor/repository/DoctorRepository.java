package com.hospital.doctor.repository;

import com.hospital.doctor.entity.Doctor;
import com.hospital.doctor.entity.Mode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import java.util.List;

@Repository
public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    List<Doctor> findByMode(Mode mode);
    List<Doctor> findBySpecialty_Id(Long specialtyId);
    List<Doctor> findBySpecialty_IdAndMode(Long specialtyId, Mode mode);
}
