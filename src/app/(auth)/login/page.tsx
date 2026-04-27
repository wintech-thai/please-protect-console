import SignInView from "@/modules/auth/view/sign-in.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PLEASE-PROTECT-SENSOR", // etc. "PLEASE-PROTECT-SENSOR - Login"
  description: "Please-Protect Sensor Web Interface",
};

export default function LoginPage() {
  return <SignInView />;
}