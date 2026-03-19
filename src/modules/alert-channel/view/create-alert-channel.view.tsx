"use client";

import { useRouter } from "next/navigation";
import AlertChannelForm from "../components/alert-channel-form";
import type { AlertChannelFormValues } from "../alert-channel.schema";
import * as alertChannelApi from "../hooks/use-alert-channel";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { alertChannelDict } from "../alert-channel.dict";

const CreateAlertChannelViewPage = () => {
  const router = useRouter();
  const { language } = useLanguage();
  const t = alertChannelDict[language as keyof typeof alertChannelDict] || alertChannelDict.EN;

  const createAlertChannelApi = alertChannelApi.useAddAlertChannel();

  const handleSubmit = async (data: AlertChannelFormValues) => {
    await createAlertChannelApi.mutateAsync({
      ChannelName: data.channelName,
      Description: data.description,
      DiscordWebhookUrl: data.discordWebhookUrl,
      Tags: data.tags ?? "",
      Type: "Discord",
      Status: "Enabled"
    }, {
      onError: (error) => {
        console.log(error)
        toast.error(error.message)
      },
      onSuccess: (data) => {
        if (data.status !== "OK" && data.status !== "SUCCESS") {
          return toast.error(data.description)
        }
      }
    })
    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
      <AlertChannelForm
        onSubmit={handleSubmit}
        type="Discord"
        isEdit={false}
        onCancel={handleCancel}
        dict={t}
      />
  );
};

export default CreateAlertChannelViewPage;
