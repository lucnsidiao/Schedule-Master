import { useState } from "react";
import { useAppointments, useCreateAppointment, useCreateAbsence } from "@/hooks/use-appointments";
import { useServices } from "@/hooks/use-services";
import { format, startOfWeek, addDays, isSameDay, addHours, parseISO } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Plus, AlertOctagon, Calendar as CalendarIcon, Loader2, CheckCircle, XCircle, Clock as ClockIcon, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import clsx from "clsx";
import { Customer } from "@shared/schema";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<any>(null);

  // Create Appointment State
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerComboOpen, setCustomerComboOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  const { toast } = useToast();

  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: services } = useServices();
  const { data: customers } = useQuery<Customer[]>({ queryKey: ["/api/customers"] });

  const createAppointment = useCreateAppointment();
  const createAbsence = useCreateAbsence();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setSelectedAppt(null);
      toast({ title: "Status updated" });
    }
  });

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Date construction
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;

    const [hours, minutes] = timeStr.split(':').map(Number);
    const startAt = new Date(dateStr);
    startAt.setHours(hours, minutes, 0, 0);

    const serviceId = formData.get("serviceId") as string;
    const service = services?.find(s => s.id === serviceId);
    if (!service) return;

    const endAt = addHours(startAt, service.duration / 60);

    try {
      const customerName = selectedCustomer ? selectedCustomer.name : formData.get("customerName") as string;
      const customerPhone = selectedCustomer ? selectedCustomer.phone : formData.get("customerPhone") as string;

      await createAppointment.mutateAsync({
        startAt: startAt,
        endAt: endAt,
        serviceId,
        customerName,
        customerPhone,
        customerId: selectedCustomer?.id, // Pass ID to link to existing
      });
      setCreateOpen(false);
      setSelectedCustomer(null); // Reset selection
      toast({ title: "Appointment created successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to create", description: error.message });
    }
  };

  const handleCreateAbsence = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;

    try {
      const startDate = new Date(`${dateStr}T${timeStr || '00:00'}`);
      await createAbsence.mutateAsync({
        startDate,
        reason: formData.get("reason") as string,
      });
      setAbsenceOpen(false);
      toast({ title: "Time blocked successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold font-display text-slate-900">Calendar</h2>
          <p className="text-slate-500">Manage bookings and schedule.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-4 font-medium text-slate-700 w-32 text-center">
              {format(selectedDate, "MMM yyyy")}
            </span>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Dialog open={absenceOpen} onOpenChange={setAbsenceOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700">
                <AlertOctagon className="w-4 h-4 mr-2" />
                Block Time
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block Time / Emergency</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAbsence} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Return Time</Label>
                    <Input type="time" name="time" required defaultValue="17:00" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Input name="reason" placeholder="Sick leave, maintenance..." required />
                </div>
                <Button type="submit" variant="destructive" className="w-full">
                  Confirm Block
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={createOpen} onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setSelectedCustomer(null);
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent className="overflow-visible">
              <DialogHeader>
                <DialogTitle>New Appointment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateAppointment} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" name="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" name="time" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select name="serviceId" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.duration} min) - ${s.price}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Popover open={customerComboOpen} onOpenChange={setCustomerComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerComboOpen}
                        className="w-full justify-between"
                      >
                        {selectedCustomer ? selectedCustomer.name : "Select existing customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                      <Command>
                        <CommandInput placeholder="Search customers..." onValueChange={setCustomerSearch} />
                        <CommandList>
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            {customers?.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.name} // Filter by name
                                onSelect={() => {
                                  setSelectedCustomer(customer);
                                  setCustomerComboOpen(false);
                                }}
                              >
                                <Check
                                  className={clsx(
                                    "mr-2 h-4 w-4",
                                    selectedCustomer?.id === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{customer.name}</span>
                                  <span className="text-xs text-slate-500">{customer.phone}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-slate-500">
                    Select a customer above OR fill in details below for a new one.
                  </p>
                </div>

                {!selectedCustomer && (
                  <>
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input name="customerName" placeholder="Jane Doe" required={!selectedCustomer} />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Phone</Label>
                      <Input name="customerPhone" placeholder="+1234567890" required={!selectedCustomer} />
                    </div>
                  </>
                )}

                {selectedCustomer && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="text-sm font-medium">{selectedCustomer.name}</p>
                    <p className="text-sm text-slate-500">{selectedCustomer.phone}</p>
                    <Button type="button" variant="link" size="sm" className="h-auto p-0 text-xs mt-1" onClick={() => setSelectedCustomer(null)}>
                      Change / New Customer
                    </Button>
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={createAppointment.isPending}>
                  {createAppointment.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Booking
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-x-auto">
        <CardContent className="p-0 min-w-[800px]">
          <div className="grid grid-cols-8 divide-x divide-slate-100">
            {/* Time Column */}
            <div className="col-span-1 bg-slate-50/50">
              <div className="h-12 border-b border-slate-100" /> {/* Header spacer */}
              {timeSlots.map(hour => (
                <div key={hour} className="h-24 border-b border-slate-100 p-2 text-xs font-medium text-slate-400 text-right">
                  {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
            </div>

            {/* Days Columns */}
            {weekDays.map(day => {
              const dayAppts = appointments?.filter(a => isSameDay(parseISO(a.startAt as unknown as string), day)) || [];
              const isToday = isSameDay(day, new Date());

              return (
                <div key={day.toString()} className="col-span-1 relative">
                  <div className={clsx(
                    "h-12 border-b border-slate-100 flex flex-col items-center justify-center sticky top-0 bg-white z-10",
                    isToday && "bg-indigo-50/50"
                  )}>
                    <span className={clsx("text-xs font-medium uppercase", isToday ? "text-indigo-600" : "text-slate-500")}>
                      {format(day, "EEE")}
                    </span>
                    <span className={clsx(
                      "text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center mt-1",
                      isToday ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-900"
                    )}>
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Grid Lines */}
                  {timeSlots.map(hour => (
                    <div key={hour} className="h-24 border-b border-slate-100" />
                  ))}

                  {/* Appointment Blocks */}
                  {dayAppts.map(appt => {
                    const start = new Date(appt.startAt);
                    const end = new Date(appt.endAt);
                    const startHour = start.getHours();
                    const startMin = start.getMinutes();
                    const durationMins = (end.getTime() - start.getTime()) / 60000;

                    // Calculate position relative to 8 AM start
                    const topOffset = ((startHour - 8) * 60 + startMin) * (96 / 60); // 96px per hour (h-24)
                    const height = durationMins * (96 / 60);

                    return (
                      <Dialog key={appt.id} open={selectedAppt?.id === appt.id} onOpenChange={(open) => !open && setSelectedAppt(null)}>
                        <DialogTrigger asChild>
                          <div
                            className={clsx(
                              "absolute left-1 right-1 rounded-md border p-2 text-xs hover:brightness-95 cursor-pointer shadow-sm transition-all",
                              appt.status === "COMPLETED" ? "bg-emerald-100 border-emerald-200" :
                                appt.status === "CANCELED" ? "bg-rose-100 border-rose-200" :
                                  appt.status === "NO_SHOW" ? "bg-amber-100 border-amber-200" :
                                    "bg-indigo-100 border-indigo-200"
                            )}
                            style={{ top: `${topOffset}px`, height: `${height}px` }}
                            onClick={() => setSelectedAppt(appt)}
                          >
                            <div className="flex items-center gap-1">
                              <div className="font-semibold text-slate-900 truncate flex-1">
                                {appt.customer?.name}
                              </div>
                              {appt.status === "COMPLETED" && <CheckCircle className="w-3 h-3 text-emerald-600" />}
                              {appt.status === "CONFIRMED" && <ClockIcon className="w-3 h-3 text-indigo-600" />}
                              {appt.status === "NO_SHOW" && <AlertOctagon className="w-3 h-3 text-amber-600" />}
                              {appt.status === "CANCELED" && <XCircle className="w-3 h-3 text-rose-600" />}
                            </div>
                            <div className="text-slate-600 truncate">
                              {appt.service?.name}
                            </div>
                            <div className="mt-1 text-[10px] font-medium uppercase opacity-60">
                              {appt.status}
                            </div>
                          </div>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Appointment Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-slate-500">Customer</Label>
                                <p className="font-medium">{appt.customer?.name}</p>
                                <p className="text-sm text-slate-500">{appt.customer?.phone}</p>
                              </div>
                              <div>
                                <Label className="text-slate-500">Service</Label>
                                <p className="font-medium">{appt.service?.name}</p>
                                <p className="text-sm text-slate-500">${appt.service?.price} • {appt.service?.duration}m</p>
                              </div>
                            </div>
                            <div>
                              <Label className="text-slate-500">Time</Label>
                              <p className="font-medium">{format(new Date(appt.startAt), "MMM d, h:mm a")} - {format(new Date(appt.endAt), "h:mm a")}</p>
                            </div>
                            <div className="space-y-2">
                              <Label>Update Status</Label>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  className="justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "COMPLETED" })}
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Completed
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start border-rose-200 text-rose-700 hover:bg-rose-50"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "CANCELED" })}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Canceled
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start border-amber-200 text-amber-700 hover:bg-amber-50"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "NO_SHOW" })}
                                >
                                  <AlertOctagon className="w-4 h-4 mr-2" />
                                  No Show
                                </Button>
                                <Button
                                  variant="outline"
                                  className="justify-start"
                                  onClick={() => updateStatusMutation.mutate({ id: appt.id, status: "CONFIRMED" })}
                                >
                                  <ClockIcon className="w-4 h-4 mr-2" />
                                  Confirmed
                                </Button>
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
