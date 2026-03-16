"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  alertChannelFormSchema, 
  type AlertChannelFormValues 
} from "../alert-channel.schema";

interface AlertChannelFormProps {
  onSubmit: (data: AlertChannelFormValues) => Promise<void> | void;
  initialData?: Partial<AlertChannelFormValues> & {
    type?: string;
    status?: string;
  };
  type?: string;
  isEdit?: boolean;
  onCancel?: () => void;
}

export default function AlertChannelForm({
  onSubmit,
  initialData,
  type: propType,
  isEdit = false,
  onCancel,
}: AlertChannelFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<AlertChannelFormValues>({
    resolver: zodResolver(alertChannelFormSchema),
    mode: "onChange",
    defaultValues: {
      channelName: initialData?.channelName || "",
      description: initialData?.description || "",
      discordWebhookUrl: initialData?.discordWebhookUrl || "",
      tags: initialData?.tags || "",
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        channelName: initialData.channelName || "",
        description: initialData.description || "",
        discordWebhookUrl: initialData.discordWebhookUrl || "",
        tags: initialData.tags || "",
      });
    }
  }, [initialData, reset]);

  const channelType = propType || initialData?.type || "Discord";
  const channelStatus = initialData?.status || "Enabled";

  const handleFormSubmit = async (data: AlertChannelFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Type Display (Read-only) */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Channel Type
        </label>
        <Input
          value={channelType}
          disabled
          className="bg-slate-950/50 border-slate-700 text-slate-400 cursor-not-allowed"
        />
      </div>

      {/* Status Display (Read-only, only for update) */}
      {isEdit && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Status
          </label>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${channelStatus === "Enabled" ? "bg-green-500" : "bg-slate-500"}`} />
            <span className={`text-sm font-medium ${channelStatus === "Enabled" ? "text-green-400" : "text-slate-500"}`}>
              {channelStatus}
            </span>
          </div>
        </div>
      )}

      {/* Channel Name */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Channel Name <span className="text-red-400">*</span>
        </label>
        <Input
          type="text"
          placeholder="Enter channel name"
          {...register("channelName")}
          errorMessage={errors.channelName?.message}
          isRequired
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Description <span className="text-red-400">*</span>
        </label>
        <textarea
          placeholder="Enter channel description"
          {...register("description")}
          className={`w-full min-h-[100px] bg-slate-950 border ${
            errors.description ? "border-red-500/50 focus:border-red-500" : "border-slate-700 focus:border-blue-500"
          } rounded-lg px-4 py-2.5 text-slate-200 outline-none transition-all placeholder:text-slate-600 text-sm resize-none`}
        />
        {errors.description && (
          <p className="text-red-400 text-xs">{errors.description.message}</p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300">
          Tags <span className="text-slate-500">(Optional)</span>
        </label>
        <Input
          type="text"
          placeholder="Enter tags separated by commas (e.g., monitoring, alerts, production)"
          {...register("tags")}
          errorMessage={errors.tags?.message}
          helperText="Separate multiple tags with commas"
        />
      </div>

      {/* Discord Webhook URL */}
      {channelType === "Discord" && (
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            Discord Webhook URL <span className="text-red-400">*</span>
          </label>
          <Input
            type="text"
            placeholder="https://discord.com/api/webhooks/..."
            {...register("discordWebhookUrl")}
            errorMessage={errors.discordWebhookUrl?.message}
            isRequired
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEdit ? "Update Channel" : "Create Channel"
          )}
        </Button>
      </div>
    </form>
  );
}