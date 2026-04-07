import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { Loader2, Save, KeyRound, User } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { changePassword, updateAdminProfile } from "@/api"
import { useAuth } from "@/lib/auth"

export const Route = createFileRoute("/dashboard/account/")({
  component: AccountPage,
})

function AccountPage() {
  const { user, updateUser } = useAuth()

  const [usernameForm, setUsernameForm] = useState({ username: user?.username || "" })
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  })
  const [passwordError, setPasswordError] = useState("")

  const updateProfileMutation = useMutation({
    mutationFn: (data: { username: string }) => updateAdminProfile({ data }),
    onSuccess: (_, vars) => {
      updateUser({ username: vars.username, full_name: vars.username })
      toast.success("Profile updated successfully")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to update profile")
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) =>
      changePassword({ data }),
    onSuccess: () => {
      toast.success("Password changed successfully")
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" })
      setPasswordError("")
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to change password")
    },
  })

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!usernameForm.username.trim()) return
    updateProfileMutation.mutate({ username: usernameForm.username.trim() })
  }

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError("")

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordError("New passwords do not match")
      return
    }
    if (passwordForm.new_password.length < 8) {
      setPasswordError("Password must be at least 8 characters")
      return
    }

    changePasswordMutation.mutate({
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
    })
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Account Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and security</p>
      </div>

      <Separator />

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your display name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={user?.email || ""} disabled className="bg-muted" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={usernameForm.username}
                onChange={(e) => setUsernameForm({ username: e.target.value })}
                placeholder="Enter username"
                minLength={3}
                required
              />
            </div>

            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm">
                {passwordError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
                minLength={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirm_password">Confirm New Password</Label>
              <Input
                id="confirm_password"
                type="password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
              />
            </div>

            <p className="text-xs text-muted-foreground">Password must be at least 8 characters</p>

            <Button type="submit" disabled={changePasswordMutation.isPending}>
              {changePasswordMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <KeyRound className="w-4 h-4 mr-2" />
              )}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
