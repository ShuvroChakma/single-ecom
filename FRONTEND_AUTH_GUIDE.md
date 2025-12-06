# Email Verification Flow - Frontend Implementation Guide

## API Endpoints

### 1. Check Email Status
**Endpoint:** `GET /api/v1/auth/check-email/?email=user@example.com`

**Purpose:** Determine what action the user should take

**Responses:**
- `action: 'register'` - Email not registered, show registration form
- `action: 'verify_email'` - Email registered but not verified, show OTP verification
- `action: 'login'` - Email verified, show login form

### 2. Register
**Endpoint:** `POST /api/v1/auth/register/`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "password2": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

### 3. Verify Email
**Endpoint:** `POST /api/v1/auth/verify-email/`
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

### 4. Resend OTP
**Endpoint:** `POST /api/v1/auth/resend-otp/`
```json
{
  "email": "user@example.com"
}
```

### 5. Login
**Endpoint:** `POST /api/v1/auth/login/`
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### 6. Debug Get OTP (Development Only)
**Endpoint:** `GET /api/v1/auth/debug/get-otp/?email=user@example.com`

## Frontend Implementation

### Registration Flow
```javascript
// 1. User enters email
const checkEmail = async (email) => {
  const response = await fetch(`/api/v1/auth/check-email/?email=${email}`);
  const data = await response.json();
  
  if (data.data.action === 'register') {
    // Show registration form
    showRegistrationForm();
  } else if (data.data.action === 'verify_email') {
    // Email exists but not verified
    showMessage('Please verify your email first');
    showOTPVerificationForm();
  } else if (data.data.action === 'login') {
    // Email already verified
    showMessage('Email already registered. Please login.');
    redirectToLogin();
  }
};

// 2. User submits registration
const register = async (userData) => {
  const response = await fetch('/api/v1/auth/register/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(userData)
  });
  
  if (response.ok) {
    // Redirect to OTP verification
    redirectToVerification(userData.email);
  }
};

// 3. User verifies email
const verifyEmail = async (email, otp) => {
  const response = await fetch('/api/v1/auth/verify-email/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, otp})
  });
  
  if (response.ok) {
    showMessage('Email verified! You can now login.');
    redirectToLogin();
  }
};

// 4. Resend OTP
const resendOTP = async (email) => {
  const response = await fetch('/api/v1/auth/resend-otp/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email})
  });
  
  if (response.ok) {
    showMessage('New OTP sent to your email');
  }
};
```

### Login Flow
```javascript
const login = async (email, password) => {
  const response = await fetch('/api/v1/auth/login/', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email, password})
  });
  
  const data = await response.json();
  
  if (response.ok) {
    // Store tokens
    localStorage.setItem('access_token', data.data.access);
    localStorage.setItem('refresh_token', data.data.refresh);
    redirectToDashboard();
  } else {
    // Check if email not verified
    if (data.message.includes('not verified')) {
      showMessage('Please verify your email first');
      redirectToVerification(email);
    } else {
      showError(data.message);
    }
  }
};
```

## User Journey Examples

### Scenario 1: New User
1. User enters email → Check email status → `action: 'register'`
2. Show registration form
3. User registers → OTP sent
4. Redirect to verification page
5. User enters OTP → Email verified
6. Redirect to login
7. User logs in → Success

### Scenario 2: Registered but Not Verified
1. User enters email → Check email status → `action: 'verify_email'`
2. Show message: "Please verify your email"
3. Show OTP input + Resend button
4. User enters OTP or resends
5. Email verified → Redirect to login

### Scenario 3: Already Verified User
1. User enters email → Check email status → `action: 'login'`
2. Show message: "Email already registered"
3. Redirect to login page
4. User logs in → Success

### Scenario 4: User Leaves During Registration
1. User registers → OTP sent
2. User closes browser/navigates away
3. User returns later
4. User enters email → Check email status → `action: 'verify_email'`
5. Show OTP verification form
6. User can verify or resend OTP

## Error Handling

```javascript
const handleAuthError = (error) => {
  if (error.message.includes('not verified')) {
    return {
      action: 'verify_email',
      message: 'Please verify your email first',
      showResendButton: true
    };
  } else if (error.message.includes('already exists')) {
    return {
      action: 'login',
      message: 'Email already registered. Please login.',
      showLoginButton: true
    };
  } else if (error.message.includes('Rate limit')) {
    return {
      action: 'wait',
      message: 'Too many attempts. Please try again later.',
      retryAfter: error.details?.retry_after
    };
  }
  
  return {
    action: 'error',
    message: error.message
  };
};
```

## UI Components Needed

1. **Email Check Component**
   - Email input
   - Check button
   - Loading state

2. **Registration Form**
   - Email, password, name fields
   - Password strength indicator
   - Submit button

3. **OTP Verification Form**
   - Email display (read-only)
   - OTP input (6 digits)
   - Resend OTP button (with countdown)
   - Verify button

4. **Login Form**
   - Email, password fields
   - Remember me checkbox
   - Login button
   - Forgot password link

5. **Error/Success Messages**
   - Toast notifications
   - Inline validation errors
   - Success confirmations
