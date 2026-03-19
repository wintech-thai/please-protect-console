import { z } from "zod";
import { type AlertChannelDict } from "./alert-channel.dict";

export type AlertChannelFormData = {
  channelName: string;
  description: string;
  discordWebhookUrl: string;
  tags?: string;
};

export const alertChannelFormSchema = (dict?: AlertChannelDict) => z.object({
  channelName: z
    .string()
    .min(1, dict?.validation.channelNameRequired || "Channel name is required")
    .max(100, dict?.validation.channelNameMax || "Channel name must be less than 100 characters"),
  description: z
    .string()
    .max(500, dict?.validation.descriptionMax || "Description must be less than 500 characters"),
  discordWebhookUrl: z
    .string()
    .min(1, dict?.validation.discordUrlRequired || "Discord webhook URL is required")
    .url(dict?.validation.discordUrlInvalid || "Invalid URL format"),
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
        message: dict?.validation.tagsInvalid || "Invalid tag format. Tags should be comma-separated.",
      }
    ),
});

export type AlertChannelFormValues = z.infer<ReturnType<typeof alertChannelFormSchema>>;
