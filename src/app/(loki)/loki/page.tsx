import LokiView from "@/modules/loki/view/loki.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loki | Log Viewer",
};

export default function LokiPage() {
  return <LokiView />;
}
