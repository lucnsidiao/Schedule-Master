import { users, businesses, services, workingDays, appointments, clients, absences } from "@shared/schema";
import { type User, type InsertUser, type Business, type Service, type WorkingDay, type Appointment, type Client, type Absence } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, or, sql } from "drizzle-orm";
import { hashPassword } from "./auth";

export interface IStorage {
  // User & Auth
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>; // username is email
  createUser(user: InsertUser & { businessName: string }): Promise<User>;

  // Business
  getBusiness(id: string): Promise<Business | undefined>;
  updateBusiness(id: string, updates: Partial<Business>): Promise<Business>;
  
  // Services
  getServices(businessId: string): Promise<Service[]>;
  createService(service: typeof services.$inferInsert): Promise<Service>;
  updateService(id: string, updates: Partial<Service>): Promise<Service>;
  deleteService(id: string): Promise<void>;

  // Working Days
  getWorkingDays(businessId: string): Promise<WorkingDay[]>;
  updateWorkingDays(businessId: string, updates: Partial<WorkingDay>[]): Promise<WorkingDay[]>;

  // Appointments
  getAppointments(businessId: string): Promise<(Appointment & { client: Client | null, service: Service | null })[]>;
  createAppointment(appointment: typeof appointments.$inferInsert & { clientName: string, clientPhone: string }): Promise<Appointment>;
  
  // Absences
  getAbsences(businessId: string): Promise<Absence[]>;
  createAbsence(absence: typeof absences.$inferInsert): Promise<Absence>;

  // Clients
  getClientByPhone(businessId: string, phone: string): Promise<Client | undefined>;
  createClient(client: typeof clients.$inferInsert): Promise<Client>;

  // Stats
  getStats(businessId: string): Promise<{ todayCount: number, revenue: number, noShows: number, recentBookings: (Appointment & { client: Client | null, service: Service | null })[] }>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { businessName: string }): Promise<User> {
    return await db.transaction(async (tx) => {
      // Create business first
      const [business] = await tx.insert(businesses).values({
        name: insertUser.businessName,
        slug: insertUser.businessName.toLowerCase().replace(/\s+/g, '-'),
      }).returning();

      // Create user linked to business
      const [user] = await tx.insert(users).values({
        ...insertUser,
        businessId: business.id,
      }).returning();

      // Initialize default working days (Mon-Fri 9-5)
      const defaultWorkingDays = Array.from({ length: 7 }).map((_, i) => ({
        dayOfWeek: i,
        isOpen: i >= 1 && i <= 5,
        startTime: "09:00",
        endTime: "17:00",
        businessId: business.id,
      }));
      await tx.insert(workingDays).values(defaultWorkingDays);

      return user;
    });
  }

  async getBusiness(id: string): Promise<Business | undefined> {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business;
  }

  async updateBusiness(id: string, updates: Partial<Business>): Promise<Business> {
    const [business] = await db.update(businesses).set(updates).where(eq(businesses.id, id)).returning();
    return business;
  }

  async getServices(businessId: string): Promise<Service[]> {
    return await db.select().from(services).where(eq(services.businessId, businessId));
  }

  async createService(service: typeof services.$inferInsert): Promise<Service> {
    const [newService] = await db.insert(services).values(service).returning();
    return newService;
  }

  async updateService(id: string, updates: Partial<Service>): Promise<Service> {
    const [service] = await db.update(services).set(updates).where(eq(services.id, id)).returning();
    return service;
  }

  async deleteService(id: string): Promise<void> {
    await db.delete(services).where(eq(services.id, id));
  }

  async getWorkingDays(businessId: string): Promise<WorkingDay[]> {
    return await db.select().from(workingDays).where(eq(workingDays.businessId, businessId));
  }

  async updateWorkingDays(businessId: string, updates: Partial<WorkingDay>[]): Promise<WorkingDay[]> {
    return await db.transaction(async (tx) => {
      const results = [];
      for (const update of updates) {
        if (update.dayOfWeek !== undefined) {
           const [updated] = await tx.update(workingDays)
             .set(update)
             .where(and(eq(workingDays.businessId, businessId), eq(workingDays.dayOfWeek, update.dayOfWeek)))
             .returning();
           results.push(updated);
        }
      }
      return results;
    });
  }

  async getAppointments(businessId: string): Promise<(Appointment & { client: Client | null, service: Service | null })[]> {
    return await db.query.appointments.findMany({
      where: eq(appointments.businessId, businessId),
      with: {
        client: true,
        service: true
      },
      orderBy: (appointments, { desc }) => [desc(appointments.startAt)],
    });
  }

  async createAppointment(data: typeof appointments.$inferInsert & { clientName: string, clientPhone: string }): Promise<Appointment> {
    return await db.transaction(async (tx) => {
      const start = new Date(data.startAt);
      const end = new Date(data.endAt);
      
      const absenceConflict = await tx.query.absences.findFirst({
        where: and(
          eq(absences.businessId, data.businessId),
          or(
             and(lte(absences.startDate, start), gte(absences.endDate, start)),
             and(lte(absences.startDate, end), gte(absences.endDate, end))
          )
        )
      });

      if (absenceConflict) {
        throw new Error("Business owner is absent during this time.");
      }

      const apptConflict = await tx.query.appointments.findFirst({
        where: and(
          eq(appointments.businessId, data.businessId),
          eq(appointments.status, "CONFIRMED"),
          or(
            and(lte(appointments.startAt, start), gte(appointments.endAt, start)),
            and(lte(appointments.startAt, end), gte(appointments.endAt, end)),
            and(gte(appointments.startAt, start), lte(appointments.endAt, end))
          )
        )
      });

      if (apptConflict) {
        throw new Error("Time slot already booked.");
      }

      let clientId = data.clientId;
      if (!clientId) {
        let client = await tx.query.clients.findFirst({
          where: and(eq(clients.businessId, data.businessId), eq(clients.phone, data.clientPhone))
        });
        
        if (!client) {
          [client] = await tx.insert(clients).values({
            name: data.clientName,
            phone: data.clientPhone,
            businessId: data.businessId
          }).returning();
        }
        clientId = client.id;
      }

      const [appt] = await tx.insert(appointments).values({
        ...data,
        clientId,
        status: "CONFIRMED"
      }).returning();

      return appt;
    });
  }

  async getAbsences(businessId: string): Promise<Absence[]> {
    return await db.select().from(absences).where(eq(absences.businessId, businessId));
  }

  async createAbsence(absence: typeof absences.$inferInsert): Promise<Absence> {
    const [newAbsence] = await db.insert(absences).values(absence).returning();
    return newAbsence;
  }

  async getClientByPhone(businessId: string, phone: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(and(eq(clients.businessId, businessId), eq(clients.phone, phone)));
    return client;
  }

  async createClient(client: typeof clients.$inferInsert): Promise<Client> {
    const [newClient] = await db.insert(clients).values(client).returning();
    return newClient;
  }

  async getStats(businessId: string): Promise<{ todayCount: number, revenue: number, noShows: number, totalClients: number, recentBookings: (Appointment & { client: Client | null, service: Service | null })[] }> {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0,0,0,0));
    const endOfDay = new Date(now.setHours(23,59,59,999));

    const todayAppts = await db.select().from(appointments).where(
      and(
        eq(appointments.businessId, businessId),
        gte(appointments.startAt, startOfDay),
        lte(appointments.startAt, endOfDay)
      )
    );

    const allAppts = await db.query.appointments.findMany({
      where: eq(appointments.businessId, businessId),
      with: { service: true, client: true },
      limit: 10,
      orderBy: (appointments, { desc }) => [desc(appointments.startAt)],
    });

    const completedAppts = await db.query.appointments.findMany({
      where: and(eq(appointments.businessId, businessId), eq(appointments.status, "COMPLETED")),
      with: { service: true }
    });

    const noShows = await db.select({ count: sql<number>`count(*)` }).from(appointments).where(and(eq(appointments.businessId, businessId), eq(appointments.status, "NO_SHOW")));
    const clientsCount = await db.select({ count: sql<number>`count(*)` }).from(clients).where(eq(clients.businessId, businessId));

    const revenue = completedAppts.reduce((sum, appt) => sum + Number(appt.service?.price || 0), 0);

    return {
      todayCount: todayAppts.length,
      revenue,
      noShows: Number(noShows[0]?.count || 0),
      totalClients: Number(clientsCount[0]?.count || 0),
      recentBookings: allAppts
    };
  }
}

export const storage = new DatabaseStorage();

async function seed() {
  const usersCount = await db.select({ count: sql<number>`count(*)` }).from(users);
  if (Number(usersCount[0].count) === 0) {
    const hashedPassword = await hashPassword("password");
    await storage.createUser({
      email: "demo@example.com",
      password: hashedPassword,
      name: "Demo User",
      role: "OWNER",
      businessName: "Demo Business"
    });
    
    const [user] = await db.select().from(users).limit(1);
    const businessId = user.businessId!;
    
    await storage.createService({
      name: "Consultation",
      price: "50",
      duration: 30,
      active: true,
      businessId
    });
    
    await storage.createService({
      name: "Therapy",
      price: "100",
      duration: 60,
      active: true,
      businessId
    });
  }
}

seed().catch(console.error);
