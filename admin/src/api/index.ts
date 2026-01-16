/**
 * API Module Exports
 * 
 * Re-exports all API server functions organized by module
 */

// Base client types and utilities
export { ApiError, AuthenticationError, setTokenRefreshCallback } from "./client";
export type { ApiErrorResponse, ApiResponse, PaginatedResponse } from "./client";

// Auth
export {
    getMe, loginAdmin, logout, refreshToken,
    type LoginResponse,
    type UserProfile
} from "./auth";

// Settings
export {
    bulkUpdateSettings, getAdminSettings, getSettings, getSettingsByCategory, initializeSettings, updateSetting, type Setting, type SettingsGrouped
} from "./settings";

// Products
export {
    createProduct, deleteProduct, getProduct,
    getProductById, getProducts, toggleProductActive, updateProduct, type Product,
    type ProductVariant
} from "./products";

// Orders
export {
    createPosOrder, getOrder, getOrders, updateOrderStatus, type Order,
    type OrderItem,
    type OrderListItem,
    type OrderStatus,
    type PaymentStatus
} from "./orders";

// Customers
export {
    createCustomer, deleteCustomer, getCustomer, getCustomers, updateCustomer,
    type Customer, type CustomerListParams, type CustomerPayload, type CustomerUpdatePayload, type PaginatedCustomers
} from "./customers";

// Payments
export {
    getGatewayConfigTemplate, getPaymentGateways, getPaymentMethods, initializeGateways, togglePaymentGateway, updatePaymentGateway, type PaymentGateway,
    type PaymentMethod
} from "./payments";

// Delivery
export {
    calculateDeliveryCharge, createDeliveryZone, deleteDeliveryZone, getDeliveryZones, updateDeliveryZone, type ChargeType, type DeliveryChargeResult, type DeliveryZone
} from "./delivery";

// Promo Codes
export {
    createPromoCode, deletePromoCode, getPromoCode, getPromoCodes, getPromoStats, updatePromoCode, validatePromoCode, type PromoCode,
    type PromoDiscountType,
    type PromoValidationResult
} from "./promo";

// Slides
export {
    createSlide, deleteSlide, getActiveSlides, getSlide, getSlides, getSlidesByType, toggleSlideActive, updateSlide, updateSlideOrder, type Slide,
    type SlideType
} from "./slides";

