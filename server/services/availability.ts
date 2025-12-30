
import { storage } from "../storage";

export async function getAvailableSlots(
    businessId: string,
    date: string,
    serviceId: string
): Promise<string[]> {
    // Fetch necessary data
    const [workingDays, appointments, absences, services] = await Promise.all([
        storage.getWorkingDays(businessId),
        storage.getAppointments(businessId),
        storage.getAbsences(businessId),
        storage.getServices(businessId),
    ]);

    const service = services.find((s) => s.id === serviceId);

    if (!service) {
        throw new Error("Service not found");
    }

    // Determine day of week
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const workingDay = workingDays.find((d) => d.dayOfWeek === dayOfWeek);

    if (!workingDay || !workingDay.isOpen) {
        return [];
    }

    // Generate slots
    const slots: string[] = [];
    const [startHour, startMin] = workingDay.startTime.split(":").map(Number);
    const [endHour, endMin] = workingDay.endTime.split(":").map(Number);

    let current = new Date(targetDate);
    current.setHours(startHour, startMin, 0, 0);

    const end = new Date(targetDate);
    end.setHours(endHour, endMin, 0, 0);

    const durationMs = service.duration * 60 * 1000;

    while (current.getTime() + durationMs <= end.getTime()) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + durationMs);

        // Check overlaps
        const isAbsent = absences.some(
            (a) =>
                (a.startDate <= slotStart &&
                    (a.endDate ? a.endDate >= slotStart : false)) ||
                (a.startDate <= slotEnd && (a.endDate ? a.endDate >= slotEnd : false)),
        );

        const isBooked = appointments.some(
            (a) =>
                a.status === "CONFIRMED" &&
                a.startAt < slotEnd &&
                a.endAt > slotStart,
        );

        if (!isAbsent && !isBooked) {
            slots.push(
                slotStart.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                }),
            );
        }

        // Increment by 30 mins
        current.setMinutes(current.getMinutes() + 30);
    }

    return slots;
}
