"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  alertChannelFormSchema,
  type AlertChannelFormValues,
} from "../alert-channel.schema";
import { useFormNavigationBlocker } from "@/hooks/use-form-navigation-blocker";
import { type AlertChannelDict } from "../alert-channel.dict";
import { useRouter } from "next/navigation";

interface AlertChannelFormProps {
  onSubmit: (data: AlertChannelFormValues) => Promise<void> | void;
  initialData?: Partial<AlertChannelFormValues> & {
    type?: string;
    status?: string;
  };
  type?: string;
  isEdit?: boolean;
  onCancel?: () => void;
  dict: AlertChannelDict;
}

export default function AlertChannelForm({
  onSubmit,
  initialData,
  type: propType,
  isEdit = false,
  onCancel,
  dict,
}: AlertChannelFormProps) {
  const { setFormDirty, handleNavigation } = useFormNavigationBlocker()
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
    watch,
    setValue,
    trigger,
  } = useForm<AlertChannelFormValues>({
    resolver: zodResolver(alertChannelFormSchema(dict)),
    mode: "onChange",
    defaultValues: {
      channelName: initialData?.channelName || "",
      description: initialData?.description || "",
      discordWebhookUrl: initialData?.discordWebhookUrl || "",
      tags: initialData?.tags || "",
    },
  });

  console.log(errors)

  const [tagInput, setTagInput] = useState("");

  const tagsString = watch("tags") || "";
  const tagsArray = tagsString
    ? tagsString
        .split(",")
        .map((t: string) => t.trim())
        .filter(Boolean)
    : [];

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (newTag && !tagsArray.includes(newTag)) {
        setValue("tags", [...tagsArray, newTag].join(", "), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setValue(
      "tags",
      tagsArray.filter((t: string) => t !== tagToRemove).join(", "),
      { shouldDirty: true, shouldValidate: true }
    );
  };

  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      trigger();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dict]);

  useEffect(() => {
    setFormDirty(isDirty)
  }, [isDirty, setFormDirty])

  const channelType = propType || initialData?.type || "Discord";
  const channelStatus = initialData?.status || "Enabled";

  const handleFormSubmit = async (data: AlertChannelFormValues) => {
    if (isEdit && !isDirty) {
      return router.back();
    }

    await onSubmit(data);
  };

  const handleBack = () => {
    handleNavigation("/system/notifications/alerts-channels")
  }

  return (
    <div className="flex flex-col h-full max-h-screen animate-in fade-in duration-500 text-slate-200">
      <div className="flex-none pt-6 px-4 md:px-8 mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-700/50 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {isEdit ? dict.updateTitle : dict.createTitle}
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">{isEdit ? dict.updateSubHeader : dict.createSubHeader}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <form
          onSubmit={handleSubmit(handleFormSubmit)}
          className="px-4 md:px-8 space-y-6"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-white mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              <span className="w-1 h-5 bg-blue-500 rounded-full"></span>
              {dict.channelInfoTitle}
            </h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {dict.columns.type}
                  </label>
                  <Input
                    value={channelType}
                    disabled
                    className="bg-slate-950/50 border-slate-700 text-slate-400 cursor-not-allowed"
                  />
                </div>

                {isEdit && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">
                      {dict.columns.status}
                    </label>
                    <div className="h-[42px] px-4 rounded-lg border border-slate-700 bg-slate-950/60 flex items-center gap-2">
                      <div
                        className={`w-2.5 h-2.5 rounded-full ${
                          channelStatus === "Enabled"
                            ? "bg-green-500"
                            : "bg-slate-500"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          channelStatus === "Enabled"
                            ? "text-green-400"
                            : "text-slate-400"
                        }`}
                      >
                        {channelStatus === "Enabled" ? dict.status.enabled : dict.status.disabled}
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {dict.columns.channelName} <span className="text-red-400">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter channel name"
                    {...register("channelName")}
                    errorMessage={errors.channelName?.message}
                    className="bg-slate-950 border-slate-700 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    {dict.columns.tags} <span className="text-slate-500">(Optional)</span>
                  </label>
                <div
                  className={`w-full bg-slate-950 border ${errors.tags ? "border-red-500/50" : "border-slate-700 focus-within:border-blue-500"} rounded-lg px-3 min-h-[42px] flex flex-wrap gap-2 items-center transition-all`}
                >
                  {tagsArray.map((tag) => (
                    <span
                      key={tag}
                      className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium px-2.5 p-1 rounded-full flex items-center gap-1.5 animate-in fade-in zoom-in duration-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-white hover:bg-blue-500/20 rounded-full p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder={
                      tagsArray.length === 0
                        ? "Type and press Enter to add tags..."
                        : ""
                    }
                    className="bg-transparent outline-none text-slate-200 flex-1 min-w-[150px] text-sm placeholder:text-slate-600 h-full py-1"
                  />
                </div>
                <input type="hidden" {...register("tags")} />
                {errors.tags && (
                  <p className="text-red-400 text-xs">{errors.tags.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">
                {dict.columns.description}
              </label>
              <Input
                type="text"
                placeholder="Enter channel description"
                {...register("description")}
                errorMessage={errors.description?.message}
                className="bg-slate-950 border-slate-700 focus:border-blue-500"
              />
            </div>

            {channelType === "Discord" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  {dict.columns.discordWebhookUrl} <span className="text-red-400">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="https://discord.com/api/webhooks/..."
                  {...register("discordWebhookUrl")}
                  errorMessage={errors.discordWebhookUrl?.message}
                  className="bg-slate-950 border-slate-700 focus:border-blue-500"
                />
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="hidden" disabled={isSubmitting} />
        </form>
      </div>

      <div className="flex-none p-4 md:px-8 border-t border-slate-800 bg-slate-950 flex justify-end gap-3 z-10">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-lg border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-all font-medium text-sm bg-transparent"
          >
            {dict.buttons.cancel}
          </Button>

        <Button
          type="button"
          onClick={handleSubmit(handleFormSubmit)}
          disabled={isSubmitting}
          className="px-8 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all font-medium text-sm flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {dict.loading}
            </>
          ) : (
            <>
              {isEdit ? dict.buttons.confirm : dict.buttons.add}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
