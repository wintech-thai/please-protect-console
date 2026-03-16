import { z } from "zod";

export type AlertChannelFormData = {
  channelName: string;
  description: string;
  discordWebhookUrl: string;
  tags?: string;
};

export const alertChannelFormSchema = z.object({
  channelName: z
    .string()
    .min(1, "Channel name is required")
    .max(100, "Channel name must be less than 100 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be less than 500 characters"),
  discordWebhookUrl: z
    .string()
    .min(1, "Discord webhook URL is required")
    .url("Invalid URL format"),
  tags: z
    .string()
    .optional()
    .refine(
      (value) => {
        if (!value) return true;
        const tags = value.split(',').map(t => t.trim());
        return tags.every(tag => tag.length > 0);
      },
      {
        message: "Invalid tag format. Tags should be comma-separated.",
      }
    ),
});

export type AlertChannelFormValues = z.infer<typeof alertChannelFormSchema>;