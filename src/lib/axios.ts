import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

const API_URL = "/api/proxy";

export const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// --- Helpers ---
const encodeBase64 = (str: string): string => {
  try {
    if (typeof window !== "undefined" && window.btoa) {
      return window.btoa(str);
    }
    return Buffer.from(str).toString("base64");
  } catch (e) {
    return str;
  }
};

const setAuthCookies = (accessToken: string, refreshToken?: string) => {
  if (typeof document === "undefined") return;
  document.cookie = `accessToken=${accessToken}; path=/; max-age=86400; SameSite=Lax`;
  if (refreshToken) {
    document.cookie = `refreshToken=${refreshToken}; path=/; max-age=604800; SameSite=Lax`;
  }
};

const clearAuthData = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("username");
  localStorage.removeItem("orgId");

  document.cookie = "accessToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "refreshToken=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "user_name=; path=/; max-age=0; SameSite=Lax";
  document.cookie = "orgId=; path=/; max-age=0; SameSite=Lax";
};

// --- Interceptors ---

client.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        const encodedToken = encodeBase64(token);
        config.headers.Authorization = `Bearer ${encodedToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response: AxiosResponse) => {
    const data = response.data;
    
    if (!data) return response;

    const { status, description, message } = data;

    if (status === undefined || status === null) {
        return response;
    }

    const statusUpper = typeof status === 'string' ? status.toUpperCase() : "";

    const isSuccess = statusUpper === "OK" || statusUpper === "SUCCESS";

    if (!isSuccess) {
      // ใช้ description จาก Backend เป็น error message หลัก
      const errorMsg = description || message || `Operation failed with status: ${statusUpper}`;

      const customError = new AxiosError(
        errorMsg,       
        statusUpper, 
        response.config,
        response.request,
        response
      );
      
      return Promise.reject(customError);
    }

    return response;
  },
  
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const errorResponse = error.response;
    const errorData = errorResponse?.data as any;
    const status = errorResponse?.status;
    const businessCode = error.code; 

    if (status === 403) {
       const apiPath = originalRequest.url || "Unknown API"; 
       const errorDesc = errorData?.description || "You do not have permission to access this resource.";
       const finalMessage = `${errorDesc} (Target: ${apiPath})`;

       const forbiddenError = new AxiosError(
          finalMessage, 
          "UNAUTHORIZED",
          originalRequest,
          error.request,
          errorResponse
       );
       return Promise.reject(forbiddenError);
    }


    const isTokenExpired =
      status === 401 ||
      businessCode === "ERROR_TOKEN_EXPIRED" || 
      (typeof errorData === "string" && (errorData.includes("IDX10223") || errorData.includes("expired"))) ||
      (errorData?.raw && typeof errorData.raw === "string" && (errorData.raw.includes("IDX10223") || errorData.raw.includes("expired")));

    if (!isTokenExpired || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          const encodedToken = encodeBase64(token);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${encodedToken}`;
          }
          return client(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const res = await axios.post(`/api/proxy/api/Auth/org/temp/action/Refresh`, {
        refreshToken,
      }, {
        headers: { "Content-Type": "application/json" }
      });

      const tokenData = res.data.token || res.data;
      const { access_token, refresh_token } = tokenData;

      if (!access_token) {
        throw new Error("Refresh failed: No access token received");
      }

      localStorage.setItem("accessToken", access_token);
      if (refresh_token) {
        localStorage.setItem("refreshToken", refresh_token);
      }
      setAuthCookies(access_token, refresh_token);

      processQueue(null, access_token);

      const newEncodedToken = encodeBase64(access_token);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newEncodedToken}`;
      }

      return client(originalRequest);

    } catch (refreshError: any) {
      processQueue(refreshError, null);
      clearAuthData();

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      
      const sessionError = new AxiosError(
          "Session expired. Please login again.",
          "INVALID_TOKEN",
          originalRequest,
          undefined,
          undefined
      );

      return Promise.reject(sessionError);
    } finally {
      isRefreshing = false;
    }
  }
);