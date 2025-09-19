"use client"
import { useRef, useState } from "react"
import Link from "next/link"
import { toast } from "react-toastify"
import { loadStripe } from "@stripe/stripe-js"
import { createClient } from "@/lib/supabase/client"
import { Camera, Crown, CreditCard, User, Mail, Save, X } from "lucide-react"

interface AccountComponentProps {
  user: any
  hasPremium: boolean
  onBilling?: () => Promise<void>
}

export default function AccountComponent({ user, hasPremium, onBilling }: AccountComponentProps) {
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profilePicture: user?.profilePicture || "",
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Change password state
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    let publicUrl: string | null = null
    try {
      setIsUploadingImage(true)
      const supabase = createClient()
      const filePath = `${user.id}-${Date.now()}-${file.name}`
      const { error: uploadErr } = await supabase.storage.from("PP").upload(filePath, file, {
        upsert: true,
        contentType: file.type,
      })
      if (uploadErr) throw uploadErr
      const { data: publicData } = supabase.storage.from("PP").getPublicUrl(filePath)
      publicUrl = publicData?.publicUrl || null
      if (!publicUrl) throw new Error("no public url")
      setProfileData((prev) => ({ ...prev, profilePicture: publicUrl! }))
    } catch (err) {
      console.error("upload failed", err)
      toast.error("Upload failed")
    }
    if (publicUrl) {
      try {
        const supabase = createClient()
        const { error: dbErr } = await supabase
          .from("users")
          .update({ profilePicture: publicUrl })
          .eq("id", user.id)
        if (dbErr) throw dbErr
        toast.success("Profile picture updated!", { position: "top-center", autoClose: 1500 })
      } catch (e) {
        console.error("DB update error", e)
        toast.error("Failed to save profile picture")
      }
    }
    setIsUploadingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const updateProfile = async () => {
    try {
      setIsUpdatingProfile(true)
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({ name: profileData.name.trim(), profilePicture: profileData.profilePicture })
        .eq("id", user.id)
      if (error) throw error
      toast.success("Profile updated", { position: "top-center", autoClose: 1500 })
      window.location.reload()
    } catch (e) {
      console.error("updateProfile error", e)
      toast.error("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleBilling = async () => {
    if (onBilling) return onBilling()
    try {
      setIsProcessing(true)
      const res = await fetch("/api/create-customer-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, stripeCustomerId: user?.stripeCustomerId, email: user?.email }),
      })
      if (!res.ok) {
        let errBody: any = null
        try { errBody = await res.json() } catch {}
        if (!errBody) {
          try { errBody = await res.text() } catch {}
        }
        console.error("Checkout creation failed:", errBody)
        toast.error("Checkout creation failed.")
        return
      }
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      await stripe!.redirectToCheckout({ sessionId: data.id })
    } catch (e) {
      console.error("handleBilling error", e)
      toast.error("Billing failed")
    } finally {
      setIsProcessing(false)
    }
  }

  // Change password handler
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    try {
      setIsChangingPassword(true)
      const supabase = createClient()
      const { data, error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password updated successfully", { position: "top-center", autoClose: 1500 })
    } catch (e) {
      console.error("changePassword error", e)
      toast.error("Failed to update password")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your profile information, billing, and premium subscription.
        </p>
      </div>

      {/* Profile Information Card */}
      <div className="rounded-lg border bg-white">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={profileData.profilePicture || "/default-avatar.jpg"}
                alt="Profile"
                className={`w-20 h-20 rounded-full border-4 border-slate-200 object-cover ${isUploadingImage ? "opacity-60" : ""}`}
              />
              {isUploadingImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-6 h-6 border-4 border-white border-t-green-500 rounded-full animate-spin" />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 shadow-lg"
                title="Change profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Profile Picture</h3>
              <p className="text-sm text-gray-500 mt-1">
                {isUploadingImage ? "Uploading image..." : "Click the camera icon to change your photo"}
              </p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfileImageChange} className="hidden" />
          </div>

          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-2" />
              Display Name
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter your name"
            />
          </div>

          {/* Email Field (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={profileData.email}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={updateProfile}
              disabled={isUpdatingProfile}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Billing & Subscription Card */}
      <div className="rounded-lg border bg-white">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Billing & Subscription</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Premium Status */}
          {hasPremium ? (
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <Crown className="w-6 h-6 text-yellow-500" />
              <div>
                <div className="font-medium text-yellow-800">Premium Subscriber</div>
                <div className="text-sm text-yellow-600">You have access to all premium features</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <div className="font-medium text-gray-800">Free Plan</div>
                <div className="text-sm text-gray-600">Upgrade to premium for advanced features</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBilling}
              disabled={isProcessing}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              <CreditCard className="w-4 h-4" />
              {isProcessing ? "Loading..." : "Manage Billing"}
            </button>
            <button
              onClick={() => setShowPremiumModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90"
            >
              <Crown className="w-4 h-4" />
              {hasPremium ? "Premium Details" : "Upgrade to Premium"}
            </button>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="rounded-lg border bg-white">
        <div className="p-6 border-b">
          <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
          <p className="mt-1 text-sm text-gray-500">Use at least 8 characters. You will stay signed in on this device.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Enter a new password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Re-enter the new password"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={isChangingPassword}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50"
            >
              {isChangingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-white bg-opacity-20 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Premium Subscription
                </h2>
                <button onClick={() => setShowPremiumModal(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
            <div className="p-6">
              {hasPremium ? (
                <div>
                  <p className="text-lg text-gray-700 mb-4">You are a premium user.</p>
                  <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-gray-900">Premium Features:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Advanced expense analytics</li>
                      <li>Unlimited expense history</li>
                      <li>Priority support</li>
                      <li>Export reports</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-700 mb-4">Upgrade to Premium to unlock all features!</p>
                  <div className="flex flex-col gap-4">
                    <h3 className="font-semibold text-gray-900">Premium Features:</h3>
                    <ul className="list-disc list-inside space-y-2 text-gray-700">
                      <li>Advanced expense analytics</li>
                      <li>Unlimited expense history</li>
                      <li>Priority support</li>
                      <li>Export reports</li>
                    </ul>
                    <Link href="/upgrade" onClick={() => setShowPremiumModal(false)}>
                      <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90">
                        Upgrade Now
                      </button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-slate-200">
              <button
                onClick={() => setShowPremiumModal(false)}
                className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}