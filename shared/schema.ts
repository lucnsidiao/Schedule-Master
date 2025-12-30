import { pgTable, text, serial, integer, boolean, timestamp, numeric, pgEnum, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["OWNER", "ADMIN", "STAFF"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["PENDING", "CONFIRMED", "CANCELED", "COMPLETED", "NO_SHOW"]);

export const businesses = pgTable("businesses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  whatsapp: text("whatsapp"),
  apiKey: uuid("api_key").notNull().unique().defaultRandom(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").default("OWNER").notNull(),
  businessId: uuid("business_id").references(() => businesses.id),
});

export const workingDays = pgTable("working_days", {
  id: uuid("id").primaryKey().defaultRandom(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sunday, 6=Saturday
  isOpen: boolean("is_open").default(true).notNull(),
  startTime: text("start_time").notNull(), // HH:mm
  endTime: text("end_time").notNull(), // HH:mm
  businessId: uuid("business_id").notNull().references(() => businesses.id),
});

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  price: numeric("price").notNull(),
  duration: integer("duration").notNull(), // minutes
  active: boolean("active").default(true).notNull(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
});

export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
});

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  startAt: timestamp("start_at").notNull(),
  endAt: timestamp("end_at").notNull(),
  status: appointmentStatusEnum("status").default("CONFIRMED").notNull(),
  customerId: uuid("customer_id").references(() => customers.id),
  serviceId: uuid("service_id").references(() => services.id),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
});

export const absences = pgTable("absences", {
  id: uuid("id").primaryKey().defaultRandom(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  reason: text("reason"),
  businessId: uuid("business_id").notNull().references(() => businesses.id),
});

// Relations
export const businessRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  appointments: many(appointments),
  services: many(services),
  customers: many(customers),
  workingDays: many(workingDays),
  absences: many(absences),
}));

export const userRelations = relations(users, ({ one }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
}));

export const appointmentRelations = relations(appointments, ({ one }) => ({
  customer: one(customers, { fields: [appointments.customerId], references: [customers.id] }),
  service: one(services, { fields: [appointments.serviceId], references: [services.id] }),
  business: one(businesses, { fields: [appointments.businessId], references: [businesses.id] }),
}));

export const customerRelations = relations(customers, ({ one, many }) => ({
  business: one(businesses, { fields: [customers.businessId], references: [businesses.id] }),
  appointments: many(appointments),
}));

export const serviceRelations = relations(services, ({ one, many }) => ({
  business: one(businesses, { fields: [services.businessId], references: [businesses.id] }),
  appointments: many(appointments),
}));

// Insert Schemas
export const insertBusinessSchema = createInsertSchema(businesses).omit({ id: true, apiKey: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertWorkingDaySchema = createInsertSchema(workingDays).omit({ id: true });
export const insertServiceSchema = createInsertSchema(services).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertAppointmentSchema = createInsertSchema(appointments).omit({ id: true });
export const insertAbsenceSchema = createInsertSchema(absences).omit({ id: true });

// Types
export type Business = typeof businesses.$inferSelect;
export type User = typeof users.$inferSelect;
export type WorkingDay = typeof workingDays.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Absence = typeof absences.$inferSelect;
