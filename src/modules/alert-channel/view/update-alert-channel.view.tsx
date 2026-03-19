"use client";

import { useParams, useRouter } from "next/navigation";
import AlertChannelForm from "../components/alert-channel-form";
import type { AlertChannelFormValues } from "../alert-channel.schema";
import * as alertChannelApi from "../hooks/use-alert-channel";
import { DefaultLoading } from "@/components/ui/default-loading";
import { toast } from "sonner";
import { useLanguage } from "@/context/LanguageContext";
import { alertChannelDict } from "../alert-channel.dict";

const UpdateAlertChannelViewPage = () => {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { language } = useLanguage();
  const t = alertChannelDict[language as keyof typeof alertChannelDict] || alertChannelDict.EN;

  const updateChannel = alertChannelApi.useUpdateAlertChannel();

  const alertChannel = alertChannelApi.useAlertChannelDetail(params.id, {
    staleTime: 0,
    gcTime: 0,
  });

  if (alertChannel.isLoading) {
    return <DefaultLoading />
  }

  if (alertChannel.error) {
    return
  }

  const alertChannelPayload = alertChannel.data;

  const handleUpdate = async (data: AlertChannelFormValues) => {
    // TODO: call update API here when wiring service/action
    await updateChannel.mutateAsync({
      id: params.id,
      payload: {
        ChannelName: data.channelName,
        Description: data.description,
        DiscordWebhookUrl: data.discordWebhookUrl,
        Tags: data.tags ?? "",
      }
    }, {
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: (data) => {
        if (data.status !== "OK" && data.status !== "SUCCESS") {
          return toast.error(data.description)
        }
        return router.back();
      }
    });
  };

  return (
      <AlertChannelForm
        isEdit
        type="Discord"
        initialData={{
          type: alertChannelPayload?.type,
          status: alertChannelPayload?.status,
          channelName: alertChannelPayload?.channelName,
          description: alertChannelPayload?.description,
          tags: alertChannelPayload?.tags,
          discordWebhookUrl: alertChannelPayload?.discordWebhookUrl,
        }}
        onSubmit={handleUpdate}
        dict={t}
      />
  );
};

export default UpdateAlertChannelViewPage;
