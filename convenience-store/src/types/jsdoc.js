/**
 * @fileoverview JSDoc Type Definitions for Convenience Store Application
 * Provides type hints for better IDE support and code documentation
 */

/**
 * @typedef {Object} User
 * @property {string} id - User UUID
 * @property {string} email - User email
 * @property {Object} user_metadata - User metadata
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Profile
 * @property {string} id - Profile UUID (matches user id)
 * @property {string|null} full_name - User's full name
 * @property {string|null} phone - Phone number
 * @property {string|null} avatar_url - Avatar image URL
 * @property {number} points - Loyalty points
 * @property {string} role - User role (customer, staff, manager, admin)
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} Product
 * @property {number} id - Product ID
 * @property {string} name - Product name (Thai)
 * @property {string|null} name_en - Product name (English)
 * @property {string|null} description - Product description
 * @property {number} price - Current price
 * @property {number|null} original_price - Original price (for discounts)
 * @property {string|null} image - Primary image URL
 * @property {string[]|null} images - Multiple image URLs
 * @property {string} category_id - Category ID
 * @property {boolean} is_flash_sale - Flash sale flag
 * @property {boolean} is_active - Active status
 * @property {number} stock - Stock quantity
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} Category
 * @property {string} id - Category ID
 * @property {string} name - Category name (Thai)
 * @property {string} name_en - Category name (English)
 * @property {string} icon - Icon name (Lucide icon)
 * @property {number} sort_order - Display order
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Banner
 * @property {number} id - Banner ID
 * @property {string} image - Banner image URL
 * @property {string} title - Banner title
 * @property {string|null} subtitle - Banner subtitle
 * @property {string|null} link - Link URL
 * @property {boolean} is_active - Active status
 * @property {number} sort_order - Display order
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Address
 * @property {number} id - Address ID
 * @property {string} user_id - User UUID
 * @property {string} label - Address label (e.g., 'บ้าน', 'ที่ทำงาน')
 * @property {string} address_line - Full address
 * @property {string|null} district - District
 * @property {string|null} province - Province
 * @property {string|null} postal_code - Postal code
 * @property {number|null} lat - Latitude
 * @property {number|null} lng - Longitude
 * @property {boolean} is_default - Default address flag
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} Order
 * @property {number} id - Order ID
 * @property {string} user_id - User UUID
 * @property {number} address_id - Address ID
 * @property {string} status - Order status (pending, confirmed, preparing, delivering, delivered, cancelled)
 * @property {number} subtotal - Subtotal amount
 * @property {number} delivery_fee - Delivery fee
 * @property {number} discount - Discount amount
 * @property {number} total - Total amount
 * @property {string} payment_method - Payment method
 * @property {string|null} notes - Order notes
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {OrderItem[]} order_items - Order items
 * @property {Address} addresses - Delivery address
 */

/**
 * @typedef {Object} OrderItem
 * @property {number} id - Order item ID
 * @property {number} order_id - Order ID
 * @property {number} product_id - Product ID
 * @property {string} product_name - Product name
 * @property {number} product_price - Product price at time of order
 * @property {number} quantity - Quantity
 * @property {number} subtotal - Subtotal (price * quantity)
 */

/**
 * @typedef {Object} Coupon
 * @property {number} id - Coupon ID
 * @property {string} code - Coupon code
 * @property {string|null} description - Description
 * @property {string} discount_type - Discount type (percentage, fixed)
 * @property {number} discount_value - Discount value
 * @property {number} min_order - Minimum order amount
 * @property {number|null} max_discount - Maximum discount amount
 * @property {number|null} usage_limit - Usage limit
 * @property {number} used_count - Times used
 * @property {string} valid_from - Valid from timestamp
 * @property {string|null} valid_until - Valid until timestamp
 * @property {boolean} is_active - Active status
 * @property {string} created_at - Creation timestamp
 */

/**
 * @typedef {Object} CartItem
 * @property {number} id - Product ID
 * @property {string} name - Product name
 * @property {number} price - Product price
 * @property {string|null} image - Product image URL
 * @property {number} quantity - Quantity in cart
 */

/**
 * @typedef {Object} Achievement
 * @property {string} id - Achievement ID
 * @property {string} name - Achievement name
 * @property {string} description - Achievement description
 * @property {string} icon - Icon name
 * @property {number} points - Points reward
 * @property {string} category - Category (orders, spending, social, special)
 * @property {Object} criteria - Achievement criteria
 */

/**
 * @typedef {Object} LoyaltyTier
 * @property {number} id - Tier ID
 * @property {string} name - Tier name
 * @property {number} level - Tier level
 * @property {number} min_points - Minimum points required
 * @property {number} discount_percentage - Discount percentage
 * @property {string} color - Display color
 * @property {string} icon - Icon name
 */

/**
 * @typedef {Object} Subscription
 * @property {number} id - Subscription ID
 * @property {string} user_id - User UUID
 * @property {string} name - Subscription name
 * @property {string} frequency - Frequency (daily, weekly, monthly)
 * @property {string} next_order_date - Next order date
 * @property {boolean} is_active - Active status
 * @property {Object[]} items - Subscription items
 */

/**
 * @typedef {Object} FlashSaleSettings
 * @property {boolean} is_active - Flash sale active status
 * @property {string|null} end_time - Flash sale end time
 */

/**
 * @typedef {Object} SupabaseError
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {string|null} details - Error details
 * @property {string|null} hint - Error hint
 */

/**
 * @typedef {Object} ErrorInfo
 * @property {string} context - Context where error occurred
 * @property {string} message - Error message
 * @property {string} code - Error code
 * @property {string|null} details - Error details
 * @property {string|null} hint - Error hint
 * @property {string} timestamp - Error timestamp
 */

export {}
