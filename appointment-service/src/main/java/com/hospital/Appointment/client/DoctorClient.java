package com.hospital.Appointment.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import com.hospital.Appointment.dto.DoctorResponse;

@FeignClient(name = "DOCTOR-SERVICE", fallback = DoctorClientFallback.class)
public interface DoctorClient {


    @PostMapping("/slots/{slotId}/book")
    void bookSlot(@PathVariable Long slotId,
                  @RequestHeader("X-Internal-Secret") String secret);

    @PostMapping("/slots/{slotId}/release")
    void releaseSlot(@PathVariable Long slotId,
                     @RequestHeader("X-Internal-Secret") String secret);

    @GetMapping("/doctors/{doctorId}")
    DoctorResponse getDoctor(@PathVariable Long doctorId);

    @GetMapping("/slots/{slotId}")
    com.hospital.Appointment.dto.SlotResponse getSlot(@PathVariable Long slotId, 
                                                     @RequestHeader("X-Internal-Secret") String secret);
}
