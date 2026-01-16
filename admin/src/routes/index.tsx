import { ApiError, getMe, loginAdmin } from "@/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useForm } from "@tanstack/react-form";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({ component: App });

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function App() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}

function LoginForm({ className, ...props }: React.ComponentProps<"div">) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Validate email
  const validateEmail = (value: string): string | null => {
    if (!value) {
      return "Email is required";
    }
    if (!emailRegex.test(value)) {
      return "Please enter a valid email address";
    }
    return null;
  };

  // Validate password
  const validatePassword = (value: string): string | null => {
    if (!value) {
      return "Password is required";
    }
    return null;
  };

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      // Clear previous errors
      setEmailError(null);
      setPasswordError(null);

      // Client-side validation
      const emailErr = validateEmail(value.email);
      if (emailErr) {
        setEmailError(emailErr);
        return;
      }

      const passwordErr = validatePassword(value.password);
      if (passwordErr) {
        setPasswordError(passwordErr);
        return;
      }

      // Start loading only after validation passes
      setIsLoading(true);

      try {
        const response = await loginAdmin({ data: value });

        if (response.success) {
          const token = response.data.access_token;

          // Fetch user profile since login doesn't return user data
          const userResponse = await getMe({ data: { token } });

          if (userResponse.success) {
            // Login with access token only (refresh token is in HttpOnly cookie)
            login(
              response.data.access_token,
              {
                id: userResponse.data.id,
                email: userResponse.data.email,
                full_name: userResponse.data.full_name,
                user_type: userResponse.data.user_type,
              }
            );

            toast.success("Login successful!");
            navigate({ to: "/dashboard" });
          } else {
            setEmailError("Failed to fetch user profile");
          }
        }
      } catch (error) {
        if (error instanceof ApiError) {
          let hasFieldError = false;

          // Parse field-specific errors
          if (error.errors && error.errors.length > 0) {
            for (const err of error.errors) {
              if (err.field === "username" || err.field === "email") {
                setEmailError(err.message);
                hasFieldError = true;
              } else if (err.field === "password") {
                setPasswordError(err.message);
                hasFieldError = true;
              }
            }
          } else if (error.field) {
            if (error.field === "username" || error.field === "email") {
              setEmailError(error.message);
              hasFieldError = true;
            } else if (error.field === "password") {
              setPasswordError(error.message);
              hasFieldError = true;
            }
          }

          // General errors (like "Invalid email or password") - show under email field
          if (!hasFieldError) {
            setEmailError(error.message);
          }
        } else {
          setEmailError(
            error instanceof Error ? error.message : "An error occurred"
          );
        }
      } finally {
        setIsLoading(false);
      }
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>
            Enter your credentials to access the admin panel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
          >
            <div className="flex flex-col gap-6">
              {/* Email Field */}
              <form.Field name="email">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium"
                    >
                      Email
                    </label>
                    <Input
                      id={field.name}
                      type="email"
                      placeholder="admin@example.com"
                      value={field.state.value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        field.handleChange(newValue);
                        // Only validate if there's already an error showing
                        if (emailError) {
                          setEmailError(validateEmail(newValue));
                        }
                      }}
                      onBlur={field.handleBlur}
                      disabled={isLoading}
                      aria-invalid={!!emailError}
                      className={
                        emailError
                          ? "border-red-500 focus-visible:border-red-500"
                          : ""
                      }
                    />
                    {emailError && (
                      <p className="text-sm text-red-500">{emailError}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Password Field */}
              <form.Field name="password">
                {(field) => (
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor={field.name}
                      className="text-sm font-medium"
                    >
                      Password
                    </label>
                    <Input
                      id={field.name}
                      type="password"
                      value={field.state.value}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        field.handleChange(newValue);
                        // Only validate if there's already an error showing
                        if (passwordError) {
                          setPasswordError(validatePassword(newValue));
                        }
                      }}
                      onBlur={field.handleBlur}
                      disabled={isLoading}
                      aria-invalid={!!passwordError}
                      className={
                        passwordError
                          ? "border-red-500 focus-visible:border-red-500"
                          : ""
                      }
                    />
                    {passwordError && (
                      <p className="text-sm text-red-500">{passwordError}</p>
                    )}
                  </div>
                )}
              </form.Field>

              {/* Submit Button */}
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
