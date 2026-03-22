import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getSlots } from "../api/doctorApi";
import { bookAppointment } from "../api/appointmentApi";

function Slots() {
    const { id } = useParams(); // doctorId

    const [date, setDate] = useState("");
    const [slots, setSlots] = useState([]);

    const fetchSlots = async () => {
        if (!date) return;

        try {
            const response = await getSlots(id, date);
            setSlots(response.data);
        } catch (error) {
            console.log(error);
            alert("Failed to fetch slots");
        }
    };

    useEffect(() => {
        fetchSlots();
    }, [date]);

    const handleBooking = async (slotId) => {
        try {
            await bookAppointment({
                doctorId: Number(id),
                slotId,
                mode: "ONLINE", // ⚠️ fix later dynamically
            });

            alert("Appointment booked");
            fetchSlots(); // refresh
        } catch (error) {
            alert(error.response?.data || "Booking failed");
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <h2>Select Date</h2>

            <input
                type="date"
                onChange={(e) => setDate(e.target.value)}
            />

            <h3>Available Slots</h3>

            {slots.length === 0 ? (
                <p>No slots available</p>
            ) : (
                slots.map((slot) => (
                    <div key={slot.id}>
            <span>
              {slot.startTime} - {slot.endTime}
            </span>

                        <button onClick={() => handleBooking(slot.id)}>
                            Book
                        </button>
                    </div>
                ))
            )}
        </div>
    );
}

export default Slots;