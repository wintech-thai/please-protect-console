"use client";

import dynamic from "next/dynamic";

const ShellTerminalView = dynamic(
  () => import("@/modules/system/view/shell-terminal.view"),
  { ssr: false }
);

export default function ShellTerminalPage() {
  return <ShellTerminalView />;
}
