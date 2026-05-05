import OverviewView from "@/modules/dashboard/view/overview.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PLEASE-PROTECT-SENSOR",
};

export default function OverviewPage() {
  return <OverviewView />;
}