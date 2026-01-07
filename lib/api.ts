import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import Cookies from "js-cookie";

const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://35.154.108.96:3000/api/v1";

type ApiErrorResponse = {
  message?: string;
  [key: string]: unknown;
};

type ResponseError = AxiosError<ApiErrorResponse>;

// Create axios instance
const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Try auth cookie first (main format), then fallback to auth-token
    let token = "";

    const authCookie = Cookies.get("auth");
    if (authCookie) {
      try {
        const parsedAuth = JSON.parse(authCookie);
        token = parsedAuth.token;
      } catch {
        // Fallback to direct token cookie
        token = Cookies.get("auth-token") || "";
      }
    } else {
      token = Cookies.get("auth-token") || "";
    }

    if (token) {
      if (!config.headers) {
        config.headers = {} as typeof config.headers;
      }
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error: ResponseError) => {
    return Promise.reject(error);
  }
);

const shouldForceLogout = (error: ResponseError): boolean => {
  const status = error.response?.status;
  if (status !== 401) {
    return false;
  }

  const message = String(error.response?.data?.message ?? "").toLowerCase();
  const url = error.config?.url ?? "";

  const criticalMessageKeywords = [
    "token",
    "expired",
    "invalid",
    "authentication",
    "session",
  ];
  const criticalEndpoints = [
    "/auth/login",
    "/auth/profile",
    "/auth/refresh",
    "/teacher/dashboard",
  ];

  const messageIndicatesTokenIssue = criticalMessageKeywords.some((keyword) =>
    message.includes(keyword)
  );
  const endpointIndicatesCriticalFailure = criticalEndpoints.some((endpoint) =>
    url.includes(endpoint)
  );

  return messageIndicatesTokenIssue || endpointIndicatesCriticalFailure;
};

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: ResponseError) => {
    if (shouldForceLogout(error)) {
      Cookies.remove("auth");
      Cookies.remove("auth-token");
      Cookies.remove("institution-data");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
