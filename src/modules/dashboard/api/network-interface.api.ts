import { client } from "@/lib/axios";
import type { NetworkInterfaceData } from "../types/data-flow.types";

interface ApiNetworkInterface {
  name: string;
  mac?: string;
  ip?: string[];
  stats?: {
    rx_bytes?: number;
    tx_bytes?: number;
    rx_packets?: number;
    tx_packets?: number;
  };
}

interface GetInterfacesResponse {
  interfaces: ApiNetworkInterface[];
  disabled: string[];
}

const getOrgId = () => typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp";

export const networkInterfaceApi = {
  getInterfaces: async (): Promise<NetworkInterfaceData[]> => {
    const orgId = getOrgId();
    const res = await client.get<GetInterfacesResponse>(`/api/Interface/org/${orgId}/action/GetInterfaces`);
    const data = res.data;

    return data.interfaces.map((iface: ApiNetworkInterface) => ({
      id: iface.name,
      name: iface.name,
      macAddress: iface.mac || "N/A",
      ipAddress: (iface.ip && iface.ip.length > 0) ? iface.ip.join(", ") : "N/A",
      isEnabled: !data.disabled.includes(iface.name),
      stats: iface.stats ? {
        rxBytes: iface.stats.rx_bytes || 0,
        txBytes: iface.stats.tx_bytes || 0,
        rxPackets: iface.stats.rx_packets || 0,
        txPackets: iface.stats.tx_packets || 0,
      } : undefined,
    }));
  },

  toggleInterfaceStatus: async (name: string, isEnabled: boolean): Promise<NetworkInterfaceData> => {
    const orgId = getOrgId();
    const action = isEnabled ? "EnableInterface" : "DisableInterface";

    await client.post(`/api/Interface/org/${orgId}/action/${action}/${name}`);

    return {
      id: name,
      name: name,
      macAddress: "",
      ipAddress: "",
      isEnabled,
    };
  },
};
