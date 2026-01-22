import { z } from 'zod';

export const createAssignmentSchema = z.object({
  resourceId: z.string().min(1, 'Resource is required'),
  teamId: z.string().min(1, 'Team is required'),
  start: z.string().datetime({ message: 'Invalid start date' }),
  end: z.string().datetime({ message: 'Invalid end date' }),
  role: z.string().optional(),
}).refine(
  (data) => new Date(data.start) < new Date(data.end),
  { message: 'Start date must be before end date', path: ['end'] }
);

export const updateAssignmentSchema = z.object({
  id: z.string().min(1),
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
  teamId: z.string().optional(),
}).refine(
  (data) => {
    if (data.start && data.end) {
      return new Date(data.start) < new Date(data.end);
    }
    return true;
  },
  { message: 'Start date must be before end date', path: ['end'] }
);

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
