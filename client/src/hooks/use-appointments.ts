import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

type CreateAppointmentInput = z.infer<typeof api.appointments.create.input>;
type CreateAbsenceInput = z.infer<typeof api.absences.create.input>;

export function useAppointments() {
  return useQuery({
    queryKey: [api.appointments.list.path],
    queryFn: async () => {
      const res = await fetch(api.appointments.list.path);
      if (!res.ok) throw new Error("Failed to fetch appointments");
      return api.appointments.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAppointmentInput) => {
      // Coerce dates to ISO strings if they are Date objects (Zod handles validation)
      const payload = {
        ...data,
        startAt: data.startAt instanceof Date ? data.startAt.toISOString() : data.startAt,
        endAt: data.endAt instanceof Date ? data.endAt.toISOString() : data.endAt,
      };

      const res = await fetch(api.appointments.create.path, {
        method: api.appointments.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 409) throw new Error("Time slot unavailable");
        throw new Error("Failed to create appointment");
      }
      return api.appointments.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.appointments.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.customers.list.path] });
    },
  });
}

export function useAbsences() {
  return useQuery({
    queryKey: [api.absences.list.path],
    queryFn: async () => {
      const res = await fetch(api.absences.list.path);
      if (!res.ok) throw new Error("Failed to fetch absences");
      return api.absences.list.responses[200].parse(await res.json());
    },
  });
}

export function useCreateAbsence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAbsenceInput) => {
      const payload = {
        ...data,
        startDate: data.startDate instanceof Date ? data.startDate.toISOString() : data.startDate,
        endDate: data.endDate && data.endDate instanceof Date ? data.endDate.toISOString() : data.endDate,
      };

      const res = await fetch(api.absences.create.path, {
        method: api.absences.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to create absence");
      return api.absences.create.responses[201].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.absences.list.path] }),
  });
}

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path);
      if (!res.ok) throw new Error("Failed to fetch stats");
      // Use the Zod schema to parse and return typed data
      return api.stats.get.responses[200].parse(await res.json());
    },
  });
}
