/**
 * Attributes API Server Functions
 */
import { createServerFn } from "@tanstack/react-start";
import { authenticatedRequest } from "./server-utils";
import type { ApiResponse } from "./client";

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
    options: Array<string> | null;
    is_required: boolean;
    is_filterable: boolean;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface AttributeGroupWithAttributes extends AttributeGroup {
    attributes: Array<Attribute>;
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
    options?: Array<string>;
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
    options?: Array<string>;
    is_required?: boolean;
    is_filterable?: boolean;
    sort_order?: number;
    is_active?: boolean;
}

// List attribute groups with attributes (public GET endpoint)
export const getAttributeGroups = createServerFn({ method: "GET" })
    .handler(async () => {
        return authenticatedRequest<ApiResponse<Array<AttributeGroupWithAttributes>>>(
            "/products/attribute-groups"
        );
    });

// Create attribute group (admin POST endpoint)
export const createAttributeGroup = createServerFn({ method: "POST" })
    .inputValidator((data: AttributeGroupPayload) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<AttributeGroupWithAttributes>>(
            "/products/admin/attribute-groups",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
    });

// Update attribute group (admin PUT endpoint)
export const updateAttributeGroup = createServerFn({ method: "POST" })
    .inputValidator((data: { group: Partial<AttributeGroupPayload>; id: string }) => data)
    .handler(async ({ data }) => {
        const { id, group } = data;

        return authenticatedRequest<ApiResponse<AttributeGroupWithAttributes>>(
            `/products/admin/attribute-groups/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(group),
            }
        );
    });

// Delete attribute group (admin DELETE endpoint)
export const deleteAttributeGroup = createServerFn({ method: "POST" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<null>>(
            `/products/admin/attribute-groups/${data.id}`,
            { method: "DELETE" }
        );
    });

// Create attribute (admin POST endpoint)
export const createAttribute = createServerFn({ method: "POST" })
    .inputValidator((data: AttributePayload) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<Attribute>>(
            "/products/admin/attributes",
            {
                method: "POST",
                body: JSON.stringify(data),
            }
        );
    });

// Update attribute (admin PUT endpoint)
export const updateAttribute = createServerFn({ method: "POST" })
    .inputValidator((data: { attribute: AttributeUpdatePayload; id: string }) => data)
    .handler(async ({ data }) => {
        const { id, attribute } = data;

        return authenticatedRequest<ApiResponse<Attribute>>(
            `/products/admin/attributes/${id}`,
            {
                method: "PUT",
                body: JSON.stringify(attribute),
            }
        );
    });

// Delete attribute (admin DELETE endpoint)
export const deleteAttribute = createServerFn({ method: "POST" })
    .inputValidator((data: { id: string }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<null>>(
            `/products/admin/attributes/${data.id}`,
            { method: "DELETE" }
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
export const getProductAttributes = createServerFn({ method: "GET" })
    .inputValidator((data: { productId: string }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<Array<ProductAttributeValue>>>(
            `/products/products/${data.productId}/attributes`
        );
    });

// Set product attribute value
export const setProductAttribute = createServerFn({ method: "POST" })
    .inputValidator((data: { productId: string; attribute: ProductAttributeValuePayload }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<ProductAttributeValue>>(
            `/products/admin/products/${data.productId}/attributes`,
            {
                method: "POST",
                body: JSON.stringify(data.attribute),
            }
        );
    });

// Delete product attribute value
export const deleteProductAttribute = createServerFn({ method: "POST" })
    .inputValidator((data: { productId: string; attributeId: string }) => data)
    .handler(async ({ data }) => {
        return authenticatedRequest<ApiResponse<null>>(
            `/products/admin/products/${data.productId}/attributes/${data.attributeId}`,
            { method: "DELETE" }
        );
    });
