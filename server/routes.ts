import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, hashPassword } from "./auth";
import { z } from "zod";
import passport from "passport";

function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Auth Routes
  app.post(api.auth.register.path, async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const input = api.auth.register.input.parse(req.body);
      const hashedPassword = await hashPassword(input.password);
      
      const user = await storage.createUser({
        ...input,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      next(err);
    }
  });

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).send();
    });
  });

  app.get(api.auth.me.path, isAuthenticated, (req, res) => {
    res.json(req.user);
  });

  // Business
  app.get(api.businesses.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.businessId) return res.status(404).json({ message: "No business found" });
    const business = await storage.getBusiness(user.businessId);
    res.json(business);
  });

  app.patch(api.businesses.update.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    if (!user.businessId) return res.status(404).json({ message: "No business found" });
    const input = api.businesses.update.input.parse(req.body);
    const updated = await storage.updateBusiness(user.businessId, input);
    res.json(updated);
  });

  // Services
  app.get(api.services.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const services = await storage.getServices(user.businessId);
    res.json(services);
  });

  app.post(api.services.create.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const input = api.services.create.input.parse(req.body);
    const service = await storage.createService({ ...input, businessId: user.businessId });
    res.status(201).json(service);
  });

  app.patch(api.services.update.path, isAuthenticated, async (req, res) => {
    const input = api.services.update.input.parse(req.body);
    const service = await storage.updateService(req.params.id, input);
    res.json(service);
  });

  app.delete(api.services.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteService(req.params.id);
    res.status(204).send();
  });

  // Working Days
  app.get(api.workingDays.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const days = await storage.getWorkingDays(user.businessId);
    res.json(days);
  });

  app.put(api.workingDays.update.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const input = api.workingDays.update.input.parse(req.body);
    const updated = await storage.updateWorkingDays(user.businessId, input);
    res.json(updated);
  });

  // Appointments
  app.get(api.appointments.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const appts = await storage.getAppointments(user.businessId);
    res.json(appts);
  });

  app.post(api.appointments.create.path, isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const bodySchema = api.appointments.create.input.extend({
        startAt: z.coerce.date(),
        endAt: z.coerce.date(),
      });
      const input = bodySchema.parse(req.body);
      const appt = await storage.createAppointment({ ...input, businessId: user.businessId });
      res.status(201).json(appt);
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      if (err.message === "Business owner is absent during this time." || err.message === "Time slot already booked.") {
        return res.status(409).json({ message: err.message });
      }
      throw err;
    }
  });

  // Absences
  app.get(api.absences.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const absences = await storage.getAbsences(user.businessId);
    res.json(absences);
  });

  app.post(api.absences.create.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const input = api.absences.create.input.parse(req.body);
    const absence = await storage.createAbsence({ ...input, businessId: user.businessId });
    res.status(201).json(absence);
  });

  // Slots Calculation
  app.get(api.slots.list.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const { date, serviceId } = api.slots.list.input.parse(req.query);
    
    // Fetch necessary data
    const workingDays = await storage.getWorkingDays(user.businessId);
    const appointments = await storage.getAppointments(user.businessId);
    const absences = await storage.getAbsences(user.businessId);
    const services = await storage.getServices(user.businessId);
    const service = services.find(s => s.id === serviceId);

    if (!service) return res.status(404).json({ message: "Service not found" });

    // Determine day of week
    const targetDate = new Date(date);
    const dayOfWeek = targetDate.getDay();
    const workingDay = workingDays.find(d => d.dayOfWeek === dayOfWeek);

    if (!workingDay || !workingDay.isOpen) {
      return res.json([]);
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
      const isAbsent = absences.some(a => 
        (a.startDate <= slotStart && (a.endDate ? a.endDate >= slotStart : false)) ||
        (a.startDate <= slotEnd && (a.endDate ? a.endDate >= slotEnd : false))
      );

      const isBooked = appointments.some(a => 
        a.status === "CONFIRMED" && (
          (a.startAt < slotEnd && a.endAt > slotStart)
        )
      );

      if (!isAbsent && !isBooked) {
        slots.push(slotStart.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }));
      }

      // Increment by 30 mins (or service duration? prompt says based on service duration. Let's step by service duration for MVP simplicity, or fixed 15m/30m)
      // Standard practice: Step by smaller interval (e.g. 15m) allows more flexibility.
      // But let's use 30 mins as a standard step.
      current.setMinutes(current.getMinutes() + 30);
    }

    res.json(slots);
  });

  // Stats
  app.get(api.stats.get.path, isAuthenticated, async (req, res) => {
    const user = req.user as any;
    const stats = await storage.getStats(user.businessId);
    res.json(stats);
  });

  // Seed Data (if empty)
  const existingUser = await storage.getUserByUsername("demo@example.com");
  if (!existingUser) {
    const hashedPassword = await hashPassword("password");
    const user = await storage.createUser({
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
      role: "OWNER",
      businessName: "Demo Clinic",
    });
    
    if (user.businessId) {
        await storage.createService({ businessId: user.businessId, name: "Consultation", price: "50", duration: 30, active: true });
        await storage.createService({ businessId: user.businessId, name: "Therapy", price: "100", duration: 60, active: true });
    }
  }
  
  return httpServer;
}
