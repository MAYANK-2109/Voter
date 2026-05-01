const { z } = require('zod');

/**
 * Validation Utils - VOTE-पथ 2.0
 */

const BoothReportSchema = z.object({
  boothId: z.string().min(1).max(50),
  location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  evmStatus: z.enum(['working', 'not_working', 'slow']),
  queueLength: z.enum(['short', 'moderate', 'long']),
  safetyStatus: z.enum(['peaceful', 'tense', 'unsafe']),
  description: z.string().max(500).optional(),
});

const ChatMessageSchema = z.object({
  message: z.string().min(1).max(1000),
});

const validateBoothReport = (data) => {
  return BoothReportSchema.safeParse(data);
};

const validateChatMessage = (data) => {
  return ChatMessageSchema.safeParse(data);
};

module.exports = {
  validateBoothReport,
  validateChatMessage
};
