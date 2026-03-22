package com.hospital.doctor.repository;

import com.hospital.doctor.entity.Slot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface SlotRepository extends JpaRepository<Slot, Long> {
    List<Slot> findByDoctor_IdAndSlotDateAndIsBookedFalse(Long doctorId, LocalDate slotDate);
    Optional<Slot> findById(Long id);
}
