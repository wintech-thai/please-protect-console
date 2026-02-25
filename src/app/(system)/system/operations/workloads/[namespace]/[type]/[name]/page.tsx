import WorkloadDetailView from "@/modules/workload/view/workload-detail.view";
import type { WorkloadType } from "@/modules/workload/api/workloads.api";

interface Props {
  params: Promise<{
    namespace: string;
    type: string;
    name: string;
  }>;
}

export default async function WorkloadDetailPage({ params }: Props) {
  const { namespace, type, name } = await params;
  return (
    <WorkloadDetailView
      namespace={namespace}
      type={type as WorkloadType}
      name={name}
    />
  );
}
