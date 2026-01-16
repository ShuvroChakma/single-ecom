/**
 * Health Check Response Types
 */

export interface HealthCheckData {
    service: string;
    status: 'healthy' | 'unhealthy';
    checks: {
        database: string;
        cache: string;
        [key: string]: string;
    };
}

export interface HealthCheckResponse {
    success: boolean;
    data: HealthCheckData;
    message: string;
    errors: Array<any>;
    meta: {
        timestamp: string;
    };
}
