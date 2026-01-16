import OverviewView from "@/modules/dashboard/view/overview.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "RTARF SENSOR",
};

export default function OverviewPage() {
  return <OverviewView />;
}