import { z } from 'zod';

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'Message is empty.').max(4000),
});
export type SendMessageValues = z.infer<typeof sendMessageSchema>;

export const startThreadSchema = z.object({
  /** Creator username — server resolves it to the creator user. */
  creatorUsername: z.string().min(2).max(40),
  body: z.string().min(1).max(4000).optional().or(z.literal('')),
});
export type StartThreadValues = z.infer<typeof startThreadSchema>;
