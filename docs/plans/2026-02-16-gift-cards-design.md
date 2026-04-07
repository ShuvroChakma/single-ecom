# Gift Cards Feature Design

## Overview

Digital gift card system allowing customers to purchase gift cards and redeem them at checkout.

## Requirements

- **Source**: Both customer purchase and admin-issued
- **Delivery**: Digital only (email)
- **Amounts**: Fixed denominations (৳500, ৳1000, ৳2000, ৳5000) + custom amount (৳100-৳50,000)
- **Redemption**: Partial use allowed (remaining balance stays on card)
- **Expiry**: Custom by admin (default: 1 year)

## Database Schema

### GiftCard Table
```sql
gift_cards (
    id UUID PRIMARY KEY,
    code VARCHAR(16) UNIQUE NOT NULL,  -- e.g., "ABCD-1234-EFGH-5678"
    initial_balance DECIMAL(12,2) NOT NULL,
    current_balance DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',  -- active, fully_redeemed, expired, disabled
    expires_at TIMESTAMP,

    -- Recipient info (for purchased cards)
    recipient_email VARCHAR(255),
    recipient_name VARCHAR(100),
    sender_name VARCHAR(100),
    message TEXT,

    -- Purchase tracking
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_by_id UUID REFERENCES customers(id),
    purchased_order_id UUID REFERENCES orders(id),

    -- Admin-issued tracking
    issued_by_id UUID REFERENCES users(id),
    issue_reason VARCHAR(255),

    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
)
```

### GiftCardRedemption Table
```sql
gift_card_redemptions (
    id UUID PRIMARY KEY,
    gift_card_id UUID REFERENCES gift_cards(id),
    order_id UUID REFERENCES orders(id),
    customer_id UUID REFERENCES customers(id),
    amount_used DECIMAL(12,2) NOT NULL,
    balance_before DECIMAL(12,2) NOT NULL,
    balance_after DECIMAL(12,2) NOT NULL,
    redeemed_at TIMESTAMP DEFAULT NOW()
)
```

## API Endpoints

### Customer Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/gift-cards/purchase` | Buy a gift card |
| GET | `/gift-cards/check/{code}` | Check balance/validity |
| POST | `/gift-cards/redeem` | Apply to order at checkout |
| GET | `/gift-cards/my-cards` | List customer's purchased cards |

### Admin Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/gift-cards` | List all gift cards |
| POST | `/admin/gift-cards` | Issue new gift card |
| GET | `/admin/gift-cards/{id}` | Get details + redemption history |
| PATCH | `/admin/gift-cards/{id}` | Update (disable, change expiry) |

## Frontend Pages

1. **Buy Gift Card** (`/gift-cards`) - Amount selection, recipient details
2. **Check Balance** (`/gift-cards/check`) - Enter code to check
3. **Checkout Integration** - Gift card input in payment step
4. **Admin Panel** - Gift card management CRUD

## Flow

### Purchase Flow
1. Customer selects amount (preset or custom)
2. Enters recipient email, name, optional message
3. Completes payment (no COD)
4. System generates unique 16-char code
5. Email sent to recipient with code

### Redemption Flow
1. At checkout, customer enters gift card code
2. System validates: exists, active, not expired, has balance
3. Available balance applied (up to order total)
4. Remaining balance stays on card
5. Redemption recorded in history

## Implementation Order

1. Backend models & migrations
2. Backend repository & service
3. Backend endpoints (customer + admin)
4. Frontend API client
5. Frontend purchase page
6. Frontend checkout integration
7. Admin panel gift card management
