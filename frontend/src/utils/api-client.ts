/**
 * API Client Utility using Axios
 * 
 * Provides a typed wrapper around Axios for making API requests
 * with automatic response parsing, error handling, and interceptors.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { APIResponse } from '../types/api.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

/**
 * API Client class using Axios
 */
class APIClient {
    private axiosInstance: AxiosInstance;

    constructor(baseURL: string = API_BASE_URL) {
        this.axiosInstance = axios.create({
            baseURL,
            timeout: API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    /**
     * Setup request and response interceptors
     */
    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config) => {
                // Add auth token if available
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            (error) => {
                // Handle common errors
                if (error.response?.status === 401) {
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('auth_token');
                    // You can dispatch an event or use your router here
                    window.dispatchEvent(new Event('unauthorized'));
                }
                return Promise.reject(error);
            }
        );
    }

    /**
     * Extract data from Axios response
     */
    private extractData<T>(response: AxiosResponse<APIResponse<T>>): APIResponse<T> {
        return response.data;
    }

    /**
     * Make a GET request
     */
    async get<T>(endpoint: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
        const response = await this.axiosInstance.get<APIResponse<T>>(endpoint, config);
        return this.extractData(response);
    }

    /**
     * Make a POST request
     */
    async post<T>(
        endpoint: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        const response = await this.axiosInstance.post<APIResponse<T>>(endpoint, data, config);
        return this.extractData(response);
    }

    /**
     * Make a PUT request
     */
    async put<T>(
        endpoint: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        const response = await this.axiosInstance.put<APIResponse<T>>(endpoint, data, config);
        return this.extractData(response);
    }

    /**
     * Make a PATCH request
     */
    async patch<T>(
        endpoint: string,
        data?: any,
        config?: AxiosRequestConfig
    ): Promise<APIResponse<T>> {
        const response = await this.axiosInstance.patch<APIResponse<T>>(endpoint, data, config);
        return this.extractData(response);
    }

    /**
     * Make a DELETE request
     */
    async delete<T>(endpoint: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
        const response = await this.axiosInstance.delete<APIResponse<T>>(endpoint, config);
        return this.extractData(response);
    }

    /**
     * Set authentication token
     */
    setAuthToken(token: string): void {
        localStorage.setItem('auth_token', token);
        this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    /**
     * Clear authentication token
     */
    clearAuthToken(): void {
        localStorage.removeItem('auth_token');
        delete this.axiosInstance.defaults.headers.common['Authorization'];
    }

    /**
     * Get the underlying Axios instance for advanced usage
     */
    getAxiosInstance(): AxiosInstance {
        return this.axiosInstance;
    }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export class for custom instances
export { APIClient };

