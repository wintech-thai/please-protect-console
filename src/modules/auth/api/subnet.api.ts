import { client } from "@/lib/axios";
import { GetSubnetsParams } from "./types";

const getOrgId = () => (typeof window !== "undefined" ? localStorage.getItem("orgId") || "temp" : "temp");

export interface CreateSubnetPayload {
  cidr: string;
  name: string; 
  tags?: string; 
}

export const subnetApi = {
  getSubnets: async (params: GetSubnetsParams = {}) => {
    const payload = {
      offset: params.offset || 0,
      limit: params.limit || 100,
      fullTextSearch: params.fullTextSearch || "",
    };
    const response = await client.post(`/api/Subnet/org/${getOrgId()}/action/GetSubnets`, payload);
    return response.data;
  },

  getSubnetCount: async (params: GetSubnetsParams = {}) => {
    const payload = {
      fullTextSearch: params.fullTextSearch || "",
    };
    const response = await client.post(`/api/Subnet/org/${getOrgId()}/action/GetSubnetCount`, payload);
    return response.data;
  },

  createSubnet: async (data: CreateSubnetPayload) => {
    const payload = {
      Cidr: data.cidr,
      Name: data.name,
      Tags: data.tags || "internal", 
    };
    const response = await client.post(`/api/Subnet/org/${getOrgId()}/action/AddSubnet`, payload);
    return response.data;
  },

  deleteSubnet: async (subnetId: string) => {
    const response = await client.delete(`/api/Subnet/org/${getOrgId()}/action/DeleteSubnetById/${subnetId}`);
    return response.data;
  },

  getSubnetById: async (subnetId: string) => {
    const response = await client.get(`/api/Subnet/org/${getOrgId()}/action/GetSubnetById/${subnetId}`);
    return response.data;
  },
  updateSubnetById: async (subnetId: string, data: CreateSubnetPayload) => {
    const payload = {
      Cidr: data.cidr,
      Name: data.name,
      Tags: data.tags || "internal", 
    };
    const response = await client.post(`/api/Subnet/org/${getOrgId()}/action/UpdateSubnetById/${subnetId}`, payload);
    return response.data;
  },

  updateSubnetsCache: async () => {
    const response = await client.post(`/api/Subnet/org/${getOrgId()}/action/UpdateSubnetsCache`);
    return response.data;
  },
  

};