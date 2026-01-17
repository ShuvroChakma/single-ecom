/**
 * Attributes API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { apiRequest, ApiResponse } from "./client";

export type AttributeType = "TEXT" | "NUMBER" | "SELECT" | "MULTI_SELECT" | "BOOLEAN";

export interface AttributeGroup {
    id: string;
    name: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Attribute {
    id: string;
    group_id: string;
    code: string;
    name: string;
    type: AttributeType;
    options: string[] | null;
    is_required: boolean;
    is_filterable: boolean;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AttributeGroupWithAttributes extends AttributeGroup {
    attributes: Attribute[];
}

export interface AttributeGroupPayload {
    name: string;
    sort_order?: number;
    is_active?: boolean;
}

export interface AttributePayload {
    group_id: string;
    code: string;
    name: string;
    type?: AttributeType;
    options?: string[];
    is_required?: boolean;
    is_filterable?: boolean;
    sort_order?: number;
    is_active?: boolean;
}

export interface AttributeUpdatePayload {
    group_id?: string;
    code?: string;
    name?: string;
    type?: AttributeType;
    options?: string[];
    is_required?: boolean;
    is_filterable?: boolean;
    sort_order?: number;
    is_active?: boolean;
}

// List attribute groups with attributes (public GET endpoint)
export const getAttributeGroups = createServerFn({ method: "POST" })
    .handler(async () => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<AttributeGroupWithAttributes[]>>(
            "/products/attribute-groups",
            { method: "GET" },
            token
        );
    });

// Create attribute group (admin POST endpoint)
export const createAttributeGroup = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: AttributeGroupPayload }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<AttributeGroupWithAttributes>>(
            "/products/admin/attribute-groups",
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            token
        );
    });

// Update attribute group (admin PUT endpoint)
export const updateAttributeGroup = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { group: Partial<AttributeGroupPayload>; id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        const { id, group } = data;

        return apiRequest<ApiResponse<AttributeGroupWithAttributes>>(
            `/products/admin/attribute-groups/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(group),
            },
            token
        );
    });

// Delete attribute group (admin DELETE endpoint)
export const deleteAttributeGroup = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<null>>(
            `/products/admin/attribute-groups/${data.id}`,
            { method: "DELETE" },
            token
        );
    });

// Create attribute (admin POST endpoint)
export const createAttribute = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: AttributePayload }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<Attribute>>(
            "/products/admin/attributes",
            {
                method: "POST",
                body: JSON.stringify(data),
            },
            token
        );
    });

// Update attribute (admin PUT endpoint)
export const updateAttribute = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { attribute: AttributeUpdatePayload; id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        const { id, attribute } = data;

        return apiRequest<ApiResponse<Attribute>>(
            `/products/admin/attributes/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(attribute),
            },
            token
        );
    });

// Delete attribute (admin DELETE endpoint)
export const deleteAttribute = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { id: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<null>>(
            `/products/admin/attributes/${data.id}`,
            { method: "DELETE" },
            token
        );
    });

// ============ PRODUCT ATTRIBUTE VALUE ============

export interface ProductAttributeValue {
    id: string;
    product_id: string;
    attribute_id: string;
    value: string;
    attribute?: Attribute;
    created_at: string;
    updated_at: string;
}

export interface ProductAttributeValuePayload {
    attribute_id: string;
    value: string;
}

// Get product attributes
export const getProductAttributes = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { productId: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<ProductAttributeValue[]>>(
            `/products/products/${data.productId}/attributes`,
            { method: "GET" },
            token
        );
    });

// Set product attribute value
export const setProductAttribute = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { productId: string; attribute: ProductAttributeValuePayload } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<ProductAttributeValue>>(
            `/products/admin/products/${data.productId}/attributes`,
            {
                method: "POST",
                body: JSON.stringify(data.attribute),
            },
            token
        );
    });

// Delete product attribute value
export const deleteProductAttribute = createServerFn({ method: "POST" })
    .handler(async ({ data }: { data: { productId: string; attributeId: string } }) => {
        const token = getCookie("access_token");
        if (!token) throw new Error("Not authenticated");

        return apiRequest<ApiResponse<null>>(
            `/products/admin/products/${data.productId}/attributes/${data.attributeId}`,
            { method: "DELETE" },
            token
        );
    });
