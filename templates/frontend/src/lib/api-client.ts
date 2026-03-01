// API Client for Context API
// Base URL can be configured via localStorage or environment

const DEFAULT_API_URL = import.meta.env.VITE_BASE_URL ?? "http://localhost:3000";

export const getApiUrl = (): string => {
    return DEFAULT_API_URL;
};

export const setApiUrl = (url: string): void => {
    localStorage.setItem("api_base_url", url);
};

export interface ApiContext {
    token: string;
    tenantId?: string;
    userId?: string;
}

interface ApiRequestOptions {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    headers?: Record<string, string>;
    correlationId?: string;
}

interface ApiResponse<T> {
    data?: T;
    error?: string;
    ok: boolean;
}

export async function apiRequest<T>(
    endpoint: string,
    ctx: ApiContext,
    options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
    const {method = "GET", body, headers = {}, correlationId} = options;

    const baseUrl = getApiUrl();

    const requestHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        ...headers,
    };

    if (ctx.token) {
        requestHeaders["Authorization"] = `Bearer ${ctx.token}`;
    }


    if (ctx.userId) {
        requestHeaders["x-user-id"] = ctx.userId;
    }
    /**
     *   if (ctx.tenantId) {
     *     requestHeaders["x-tenant-id"] = ctx.tenantId;
     *   }
     */

    if (correlationId) {
        requestHeaders["correlation_id"] = correlationId;
    }

    try {
        const response = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers: requestHeaders,
            body: body ? JSON.stringify(body) : undefined,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                error: data.error || `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return {ok: true, data};
    } catch (error) {
        return {
            ok: false,
            error: error instanceof Error ? error.message : "Network error",
        };
    }
}

// Query endpoints (GET)
export const queryEndpoints = {
    //tables: "/api/query/tables-collection",
};

// Command endpoints (POST)
export const commandEndpoints = {
    //addTable: "/api/addtable",
};
