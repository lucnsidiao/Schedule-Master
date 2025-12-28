import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type UpdateBusinessInput = z.infer<typeof api.businesses.update.input>;
type UpdateWorkingDaysInput = z.infer<typeof api.workingDays.update.input>;

export function useBusiness() {
  return useQuery({
    queryKey: [api.businesses.get.path],
    queryFn: async () => {
      const res = await fetch(api.businesses.get.path);
      if (!res.ok) throw new Error("Failed to fetch business");
      return api.businesses.get.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateBusiness() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateBusinessInput) => {
      const res = await fetch(api.businesses.update.path, {
        method: api.businesses.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update business");
      return api.businesses.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.businesses.get.path] }),
  });
}

export function useWorkingDays() {
  return useQuery({
    queryKey: [api.workingDays.list.path],
    queryFn: async () => {
      const res = await fetch(api.workingDays.list.path);
      if (!res.ok) throw new Error("Failed to fetch working days");
      return api.workingDays.list.responses[200].parse(await res.json());
    },
  });
}

export function useUpdateWorkingDays() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateWorkingDaysInput) => {
      const res = await fetch(api.workingDays.update.path, {
        method: api.workingDays.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update working days");
      return api.workingDays.update.responses[200].parse(await res.json());
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [api.workingDays.list.path] }),
  });
}
