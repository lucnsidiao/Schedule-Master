import { z } from 'zod';
import { 
  insertBusinessSchema, 
  insertUserSchema, 
  insertWorkingDaySchema, 
  insertServiceSchema, 
  insertCustomerSchema, 
  insertAppointmentSchema, 
  insertAbsenceSchema,
  businesses, users, workingDays, services, customers, appointments, absences
} from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  conflict: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema.extend({ businessName: z.string() }),
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.validation,
      },
    },
  },
  businesses: {
    get: {
      method: 'GET' as const,
      path: '/api/business',
      responses: {
        200: z.custom<typeof businesses.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/business',
      input: insertBusinessSchema.partial(),
      responses: {
        200: z.custom<typeof businesses.$inferSelect>(),
      },
    },
  },
  services: {
    list: {
      method: 'GET' as const,
      path: '/api/services',
      responses: {
        200: z.array(z.custom<typeof services.$inferSelect>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/services',
      input: insertServiceSchema.omit({ businessId: true }),
      responses: {
        201: z.custom<typeof services.$inferSelect>(),
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/services/:id',
      input: insertServiceSchema.omit({ businessId: true }).partial(),
      responses: {
        200: z.custom<typeof services.$inferSelect>(),
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/services/:id',
      responses: {
        204: z.void(),
      },
    },
  },
  workingDays: {
    list: {
      method: 'GET' as const,
      path: '/api/working-days',
      responses: {
        200: z.array(z.custom<typeof workingDays.$inferSelect>()),
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/working-days',
      input: z.array(insertWorkingDaySchema.omit({ businessId: true })),
      responses: {
        200: z.array(z.custom<typeof workingDays.$inferSelect>()),
      },
    },
  },
  appointments: {
    list: {
      method: 'GET' as const,
      path: '/api/appointments',
      responses: {
        200: z.array(z.custom<typeof appointments.$inferSelect & { customer: typeof customers.$inferSelect, service: typeof services.$inferSelect }>()),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/appointments',
      input: insertAppointmentSchema.omit({ businessId: true, status: true }).extend({
        clientName: z.string(),
        clientPhone: z.string(),
      }),
      responses: {
        201: z.custom<typeof appointments.$inferSelect>(),
        409: errorSchemas.conflict,
        400: errorSchemas.validation,
      },
    },
  },
  absences: {
    create: {
      method: 'POST' as const,
      path: '/api/absences',
      input: insertAbsenceSchema.omit({ businessId: true }),
      responses: {
        201: z.custom<typeof absences.$inferSelect>(),
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/absences',
      responses: {
        200: z.array(z.custom<typeof absences.$inferSelect>()),
      },
    },
  },
  slots: {
    list: {
      method: 'GET' as const,
      path: '/api/slots',
      input: z.object({
        date: z.string(),
        serviceId: z.string(),
      }),
      responses: {
        200: z.array(z.string()), // Available times
      },
    },
  },
  stats: {
    get: {
      method: 'GET' as const,
      path: '/api/stats',
      responses: {
        200: z.object({
          todayCount: z.number(),
          revenue: z.number(),
          noShows: z.number(),
          totalCustomers: z.number(),
          recentBookings: z.array(z.custom<typeof appointments.$inferSelect & { customer: typeof customers.$inferSelect, service: typeof services.$inferSelect }>()),
        }),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
