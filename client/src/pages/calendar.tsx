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
import { ChevronLeft, ChevronRight, Plus, AlertOctagon, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import clsx from "clsx";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [absenceOpen, setAbsenceOpen] = useState(false);
  const { toast } = useToast();

  const { data: appointments, isLoading: isLoadingAppts } = useAppointments();
  const { data: services } = useServices();
  const createAppointment = useCreateAppointment();
  const createAbsence = useCreateAbsence();

  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const timeSlots = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  const handleCreateAppointment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // Quick and dirty date construction (in real app use a date picker)
    const dateStr = formData.get("date") as string;
    const timeStr = formData.get("time") as string;
    
    // Round time to nearest 15 minutes for optimization
    const [hours, minutes] = timeStr.split(':').map(Number);
    const roundedMinutes = Math.round(minutes / 15) * 15;
    const finalMinutes = roundedMinutes === 60 ? 0 : roundedMinutes;
    const finalHours = roundedMinutes === 60 ? hours + 1 : hours;
    const optimizedTime = `${String(finalHours).padStart(2, '0')}:${String(finalMinutes).padStart(2, '0')}`;

    const startAt = new Date(`${dateStr}T${optimizedTime}`);
    
    const serviceId = formData.get("serviceId") as string;
    const service = services?.find(s => s.id === serviceId);
    if (!service) return;

    const endAt = addHours(startAt, service.duration / 60);

    try {
      await createAppointment.mutateAsync({
        startAt: startAt,
        endAt: endAt,
        serviceId,
        clientName: formData.get("clientName") as string,
        clientPhone: formData.get("clientPhone") as string,
      });
      setCreateOpen(false);
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
                    <Label>Time</Label>
                    <Input type="time" name="time" required />
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

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                <Plus className="w-4 h-4 mr-2" />
                New Appointment
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                  <Label>Client Name</Label>
                  <Input name="clientName" placeholder="Jane Doe" required />
                </div>
                <div className="space-y-2">
                  <Label>Client Phone</Label>
                  <Input name="clientPhone" placeholder="+1234567890" required />
                </div>
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
                      <div
                        key={appt.id}
                        className="absolute left-1 right-1 rounded-md bg-indigo-100 border border-indigo-200 p-2 text-xs hover:brightness-95 cursor-pointer shadow-sm transition-all"
                        style={{ top: `${topOffset}px`, height: `${height}px` }}
                      >
                        <div className="font-semibold text-indigo-900 truncate">
                          {appt.client.name}
                        </div>
                        <div className="text-indigo-700 truncate">
                          {appt.service.name}
                        </div>
                      </div>
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
