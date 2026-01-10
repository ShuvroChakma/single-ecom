/**
 * API Module Exports
 * 
 * Re-exports all API server functions organized by module
 */

// Base client types
export type { ApiError, ApiResponse, PaginatedResponse } from "./client";

// Auth
export {
    getMe, loginAdmin, logout,
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
    getCustomer, getCustomers, toggleCustomerActive, updateCustomer, type Customer
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

