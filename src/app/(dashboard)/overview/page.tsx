import OverviewView from "@/modules/dashboard/view/overview.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Please-Protect-Sensor",
};

export default function OverviewPage() {
  return <OverviewView />;
}