import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Helper Encode Base64
const encodeBase64 = (str: string) => {
  try {
    if (typeof window !== "undefined") {
      return window.btoa(str);
    } else {
      return Buffer.from(str).toString("base64");
    }
  } catch (e) {
    console.error("Base64 encode failed", e);
    return str;
  }
};

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token && config.headers) {
      const encodedToken = encodeBase64(token);
      config.headers.Authorization = `Bearer ${encodedToken}`;
    }
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const errorData = error.response?.data as any;
    
    const isTokenExpired = 
        error.response?.status === 401 || 
        (errorData?.raw && typeof errorData.raw === 'string' && (errorData.raw.includes("IDX10223") || errorData.raw.includes("expired"))) ||
        (typeof errorData === 'string' && (errorData.includes("IDX10223") || errorData.includes("expired")));

    if (isTokenExpired && !originalRequest._retry) {
      
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            const encodedToken = encodeBase64(token as string);
            originalRequest.headers["Authorization"] = "Bearer " + encodedToken;
            return client(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(`/api/proxy/api/Auth/org/temp/action/Refresh`, { 
          refreshToken 
        });
        
        const { access_token, refresh_token } = res.data.token || res.data; 

        localStorage.setItem("accessToken", access_token);
        document.cookie = `accessToken=${access_token}; path=/; max-age=86400; SameSite=Lax`;
        
        if (refresh_token) {
            localStorage.setItem("refreshToken", refresh_token);
            document.cookie = `refreshToken=${refresh_token}; path=/; max-age=604800; SameSite=Lax`;
        }

        processQueue(null, access_token);
        
        const newEncodedToken = encodeBase64(access_token);
        originalRequest.headers["Authorization"] = "Bearer " + newEncodedToken;
        
        return client(originalRequest);

      } catch (refreshError) {
        processQueue(refreshError, null);
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("username");
        localStorage.removeItem("orgId");
        
        document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
        document.cookie = "orgId=; path=/; max-age=0; SameSite=Lax";

        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);