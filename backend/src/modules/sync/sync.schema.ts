import { z } from 'zod';

export const syncUserSchema = z.object({
  params: z.object({
    userId: z.string().regex(/^\d+$/, 'userId ต้องเป็นตัวเลข'),
  }),
});

export type SyncUserParams = z.infer<typeof syncUserSchema>['params'];
