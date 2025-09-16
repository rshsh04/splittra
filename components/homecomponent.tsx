"use client"
import { useState, useEffect, useRef } from "react"
import Expenses from "./expenses"
import { ChevronDown, Settings, LogOut, Users, Edit2, Check, X, User, Mail, Camera, Save, Crown, CreditCard } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function HomeComponent({ user }: { user: any }) {

  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [householdOwnerId, setHouseholdOwnerId] = useState<string>("")
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false)

  // Fetch household members and owner
  useEffect(() => {
    const fetchMembers = async () => {
      const householdId = user?.household_id ?? user?.householdId
      if (!householdId) return
      try {
        const supabase = require('@/lib/supabase/client').createClient();
        const { data: household, error: hhErr } = await supabase
          .from('household')
          .select('*')
          .eq('id', householdId)
          .maybeSingle();
        if (hhErr) throw hhErr;
        if (!household) {
          setHouseholdName("Household")
          setHouseholdCode("")
          setHouseholdOwnerId("")
          setHouseholdMembers([])
          return
        }
        setHouseholdName(household.household_name || household.householdName || "Household")
        setHouseholdCode(household.code || "")
        setHouseholdOwnerId(household.owner_id ? household.owner_id.toString() : "")
        // Fetch member details
        if (household.members && household.members.length > 0) {
          const { data: usersRes, error: usersErr } = await supabase
            .from('users')
            .select('*')
            .in('id', household.members)
          if (usersErr) throw usersErr;
          setHouseholdMembers(usersRes || [])
        } else {
          setHouseholdMembers([])
        }
      } catch (err) {
        // ...
      }
    }
    fetchMembers()
  }, [user?.household_id, user?.householdId, showHouseholdDropdown])
  const [householdName, setHouseholdName] = useState("Household")
  const [householdCode, setHouseholdCode] = useState("")
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    profilePicture: user?.profilePicture || ""
  })
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [showPremiumModal, setShowPremiumModal] = useState(false)

  const premiumUntil = user?.premiumUntil ? new Date(user.premiumUntil) : null
  const hasPremium = premiumUntil && premiumUntil > new Date();

  const householdRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  useEffect(() => {
    const fetchHousehold = async () => {
      const householdId = user?.household_id ?? user?.householdId
      if (!householdId) return
      try {
        const supabase = require('@/lib/supabase/client').createClient();
        const { data: household, error: hhErr } = await supabase
          .from('household')
          .select('*')
          .eq('id', householdId)
          .maybeSingle();
        if (hhErr) throw hhErr;
        if (!household) return
        setHouseholdName(household.household_name || household.householdName || "Household")
        setHouseholdCode(household.code || "")
      } catch (err) {
        // ...
      }
    }
    fetchHousehold()
  }, [user?.household_id])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (householdRef.current && !householdRef.current.contains(event.target as Node)) {
        setShowHouseholdDropdown(false)
        setIsEditingName(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
        nameInputRef.current?.select()
      }, 100)
    }
  }, [isEditingName])

  useEffect(() => {
    if (showProfileModal) {
      setProfileData({
        name: user?.name || "",
        email: user?.email || "",
        profilePicture: user?.profilePicture || ""
      })
    }
  }, [showProfileModal, user])

  const handleLogout = async () => {
    const supabase = require('@/lib/supabase/client').createClient();
    await supabase.auth.signOut();
    window.location.reload();
  }

  const handleLeaveHousehold = async () => {
    if (!user?.household_id) return
    try {
      const supabase = require('@/lib/supabase/client').createClient();
      // Fetch household
      const { data: household, error: hhErr } = await supabase
        .from('household')
        .select('*')
        .eq('id', user.household_id)
        .maybeSingle();
      if (hhErr) throw hhErr;
      if (!household) throw new Error('Household not found')
      // Remove user from members
      const newMembers = (household.members || []).filter((m: any) => m !== user.id)
      const { error: updErr } = await supabase
        .from('household')
        .update({ members: newMembers })
        .eq('id', household.id);
      if (updErr) throw updErr;
      // Update user row
      const { error: userErr } = await supabase
        .from('users')
        .update({ household_id: null })
        .eq('id', user.id);
      if (userErr) throw userErr;
      window.location.reload();
    } catch (err) {
      alert("Failed to leave household.")
    }
  }

  const startEditingName = () => {
    setEditNameValue(householdName)
    setIsEditingName(true)
  }

  const cancelEditingName = () => {
    setIsEditingName(false)
    setEditNameValue("")
  }

  const saveHouseholdName = async () => {
    if (!editNameValue.trim()) {
      alert("Household name cannot be empty")
      return
    }

    try {
      const supabase = require('@/lib/supabase/client').createClient();
      const { data, error } = await supabase
        .from('household')
        .update({ household_name: editNameValue.trim() })
        .eq('id', user.household_id);
      if (error) throw error;
      setHouseholdName(editNameValue.trim())
      setIsEditingName(false)
      setEditNameValue("")
    } catch (err) {
      console.error("Error updating household name:", err)
      alert("Failed to update household name")
    }
  }

  const handleNameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveHouseholdName()
    } else if (e.key === 'Escape') {
      cancelEditingName()
    }
  }

  const copyHouseholdCode = async () => {
    if (householdCode) {
      await navigator.clipboard.writeText(householdCode)
      toast.success('Invite code copied to clipboard!', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      })
    }
  }

  const openProfileModal = () => {
    setShowProfileModal(true)
    setShowProfileDropdown(false)
  }

  const closeProfileModal = () => {
    setShowProfileModal(false)
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      profilePicture: user?.profilePicture || ""
    })
  }

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user?.id || !user?.auth_id) {
      toast.error('User not loaded yet')
      return
    }
    const supabase = require('@/lib/supabase/client').createClient();
    // Basic validations
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('File too large (max 5MB)')
      return
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setIsUploadingImage(true)
    let publicUrl: string | null = null
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      // Use auth_id (UUID) for per-user folder to align with storage RLS policies referencing auth.uid()
      const objectPrefix = user.auth_id
      const filePath = `${objectPrefix}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('PP').upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      })
      if (uploadErr) {
        console.error('Storage upload error', uploadErr)
        // Likely RLS on storage.objects
        if (uploadErr.message?.toLowerCase().includes('row-level security')) {
          toast.error('Upload blocked by storage RLS policy')
        } else {
          toast.error('Failed to upload file')
        }
        return
      }
      const { data: publicData } = supabase.storage.from('PP').getPublicUrl(filePath)
      publicUrl = publicData?.publicUrl || null
      if (!publicUrl) {
        toast.error('Could not obtain public URL')
        return
      }
      // Optimistic local update
      setProfileData(prev => ({ ...prev, profilePicture: publicUrl! }))
    } catch (err: any) {
      console.error('Unexpected upload failure', err)
      toast.error('Upload failed')
    }
    // Persist to DB separately so we can differentiate errors
    if (publicUrl) {
      try {
        const { error: dbErr } = await supabase
          .from('users')
          .update({ profilePicture: publicUrl })
          .eq('id', user.id)
        if (dbErr) {
          console.error('DB update error', dbErr)
          if (dbErr.message?.toLowerCase().includes('row-level security')) {
            toast.error('DB update blocked by RLS policy')
          } else {
            toast.error('Failed to save profile picture')
          }
        } else {
          toast.success('Profile picture updated!', { position: 'top-center', autoClose: 2000 })
        }
      } catch (e) {
        console.error('DB update exception', e)
        toast.error('Failed to save profile picture')
      }
    }
    setIsUploadingImage(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const updateProfile = async () => {
    setIsUpdatingProfile(true)
    try {
      const supabase = require('@/lib/supabase/client').createClient();
      await supabase
        .from('users')
        .update({
          name: profileData.name.trim(),
          profilePicture: profileData.profilePicture
        })
        .eq('id', user.id);
      alert("Profile updated successfully!")
      window.location.reload()
    } catch (err) {
      alert("Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-slate-50 transition-all duration-300">
      <ToastContainer />
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-slate-200 px-4 py-4 flex flex-row sm:flex-row items-center sm:px-20 justify-between transition-all duration-300 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            <Link href="/" className="flex items-center gap-2 transition-all duration-300 hover:scale-105">
              <Image
                src="/logo.png"
                alt="Logo"
                width={90}
                height={90}
                className="object-contain transition-all duration-300"
                priority
              />
            </Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Household Dropdown */}
          <div ref={householdRef} className="relative">
            <button
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 font-medium px-2 py-1 sm:px-4 sm:py-2 rounded-lg transition-all duration-300 ease-in-out border border-green-200 hover:border-green-300 hover:shadow-md transform hover:-translate-y-0.5 w-full sm:w-auto text-sm sm:text-base"
              onClick={() => setShowHouseholdDropdown(!showHouseholdDropdown)}
            >
              <Users className="w-4 h-4 transition-transform duration-300" />
              <span className="truncate max-w-[80px] sm:max-w-none">{householdName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showHouseholdDropdown ? 'rotate-180' : ''}`} />
            </button>
            <div className={`fixed sm:absolute top-0 sm:top-auto left-0 right-0 sm:right-0 sm:left-auto mt-0 sm:mt-2 w-screen sm:w-128 bg-white rounded-xl shadow-xl border border-slate-200 overflow-y-auto z-[100] transition-all duration-300 ease-in-out transform ${showHouseholdDropdown
              ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
              : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              }`} style={{ minHeight: '320px', padding: '1.25rem', maxHeight: '90vh' }}>
              {/* Members List */}
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="font-semibold text-slate-800 mb-2">Members</div>
                <ul className="space-y-2">
                  {householdMembers.map(member => (
                    <li key={member.$id} className={`flex items-center justify-between p-2 rounded-lg ${member.$id === householdOwnerId ? 'bg-white border border-gray-300' : 'bg-white border border-slate-200'}`}>
                      <div className="flex items-center gap-2 relative group">
                        <img src={member.profilePicture || '/default-avatar.jpg'} alt={member.name} className="w-8 h-8 rounded-full border" />
                        <span className={`font-medium ${member.$id === householdOwnerId ? 'text-yellow-700' : 'text-slate-800'}`}>{member.name || member.email}</span>
                        {member.$id === householdOwnerId && (
                          <>
                            <Crown className="w-4 h-4 text-yellow-500 cursor-pointer group-hover:scale-110 transition-transform duration-200" />
                            <span className="absolute right-10 top-1 z-10 hidden group-hover:flex bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded shadow-md border border-yellow-300 whitespace-nowrap">
                              Owner of the household
                            </span>
                          </>
                        )}
                      </div>
                      {user.$id === householdOwnerId && member.$id !== householdOwnerId && (
                        (pendingRemoveId === member.$id ? (
                          <button
                            className="text-red-600 bg-red-100 border border-red-300 px-2 py-1 rounded font-bold animate-pulse"
                            onClick={async () => {
                              try {
                                const supabase = require('@/lib/supabase/client').createClient();
                                // Remove member from household
                                const newMembers = householdMembers.filter(m => m.id !== member.id).map(m => m.id)
                                await supabase
                                  .from('household')
                                  .update({ members: newMembers })
                                  .eq('id', user.household_id)
                                // Set member's household_id to null
                                await supabase
                                  .from('users')
                                  .update({ household_id: null })
                                  .eq('id', member.id)
                                setHouseholdMembers(householdMembers.filter(m => m.id !== member.id))
                                setPendingRemoveId(null)
                                toast.success('Member removed!', { position: 'top-center', autoClose: 2000 })
                              } catch (err) {
                                toast.error('Failed to remove member')
                                setPendingRemoveId(null)
                              }
                            }}
                          >Sure?</button>
                        ) : (
                          <button
                            className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition-all duration-200 border border-red-200 bg-red-50 hover:bg-red-100"
                            onClick={() => setPendingRemoveId(member.$id)}
                          >Remove</button>
                        ))
                      )}
                    </li>
                  ))}
                  {householdMembers.length === 0 && <li className="text-slate-500 text-sm">No members found</li>}
                </ul>
              </div>

              <div className="py-2">
                {householdCode && (
                  <button
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 text-slate-700 transition-all duration-300 hover:translate-x-1"
                    onClick={copyHouseholdCode}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Invite Code:</span>
                      <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded transition-all duration-300 hover:bg-slate-200">
                        {householdCode}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">Click to copy</div>
                  </button>
                )}
              </div>

              <div className="border-t border-slate-200">
                <div className={`transition-all duration-300 ease-in-out ${showLeaveConfirm
                  ? 'max-h-40 opacity-100'
                  : 'max-h-0 opacity-0 overflow-hidden'
                  }`}>
                  <div className="p-4 bg-red-50 animate-in slide-in-from-top-2 duration-300">
                    <p className="text-sm text-red-800 mb-3 font-medium">
                      Are you sure you want to leave this household? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        onClick={handleLeaveHousehold}
                      >
                        <LogOut className="w-3 h-3 transition-transform duration-300 hover:-translate-x-1" />
                        Yes, Leave
                      </button>
                      <button
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-md"
                        onClick={() => setShowLeaveConfirm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  className={`w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-300 flex items-center gap-3 hover:translate-x-1 ${showLeaveConfirm ? 'hidden' : ''
                    }`}
                  onClick={() => setShowLeaveConfirm(true)}
                >
                  <LogOut className="w-4 h-4 transition-transform duration-300 hover:-translate-x-1" />
                  Leave Household
                </button>
              </div>
            </div>
          </div>

          {/* Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              className="flex items-center gap-2 hover:opacity-80 transition-all duration-300 hover:scale-105 hover:shadow rounded-full px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              {hasPremium && (
                <div style={{ color: 'gold', fontWeight: 'bold', marginBottom: 8 }} className="border border-yellow-400 px-2 py-1 mt-2 rounded-full bg-yellow-50 text-xs animate-pulse">
                  ★ Premium User
                </div>
              )}
              <img
                src={user?.profilePicture || "/default-avatar.jpg"}
                alt="Profile"
                className="w-10 h-10 rounded-full border-2 border-slate-200 object-cover transition-all duration-300 hover:border-green-300"
              />

            </button>
            <div className={`absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 transition-all duration-300 ease-in-out transform ${showProfileDropdown
              ? 'opacity-100 translate-y-0 scale-100'
              : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
              }`}>
              <div className="p-4 bg-slate-50 border-b border-slate-200 transition-all duration-300">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-slate-800">
                    {user?.name || user?.email || "User"}
                  </div>
                  {user?.isPremium && (
                    <div title={`Premium until ${new Date(user.premiumUntil).toLocaleDateString()}`}>
                      <Crown className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-500">{user?.email}</div>
              </div>
              <div className="py-2">
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
                  onClick={openProfileModal}
                >
                  <Settings className="w-4 h-4 transition-transform duration-300 hover:rotate-90" />
                  Account Settings
                </button>
                <Link href="/billing">
                  <button
                    className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
                  >
                    <CreditCard className="w-4 h-4 text-purple-500 transition-transform duration-300 hover:rotate-90" />
                    Billing
                  </button>
                </Link>

                
                <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 text-slate-700 flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Crown className="w-4 h-4 text-yellow-500" />
                  {hasPremium ? `Premium (Until ${premiumUntil?.toLocaleDateString()})` : 'Upgrade to Premium'}
                </button>
              </div>
              <div className="border-t border-slate-200">
                <button
                  className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-all duration-300 flex items-center gap-3 hover:translate-x-1"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 transition-transform duration-300 hover:-translate-x-1" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Profile Settings Modal */}
      <div className={`fixed inset-0 backdrop-blur-md bg-white bg-opacity-20 flex items-center justify-center z-[100] transition-all duration-500 ease-in-out ${showProfileModal
        ? 'opacity-100 visible'
        : 'opacity-0 invisible'
        }`}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto transition-all duration-500 ease-in-out transform ${showProfileModal
          ? 'scale-100 translate-y-0 opacity-100'
          : 'scale-75 translate-y-8 opacity-0'
          }`}>
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-200 transition-all duration-300">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <Settings className="w-5 h-5 transition-transform duration-300 hover:rotate-90" />
                Account Settings
              </h2>
              <button
                onClick={closeProfileModal}
                className="p-2 hover:bg-slate-100 rounded-lg transition-all duration-300 hover:scale-110 hover:rotate-90"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Profile Picture */}
            <div className="text-center animate-in fade-in duration-500">
              <div className="relative inline-block group">
                <div className="relative">
                  <img
                    src={profileData.profilePicture || "/default-avatar.jpg"}
                    alt="Profile"
                    className={`w-24 h-24 rounded-full border-4 border-slate-200 object-cover transition-all duration-300 group-hover:scale-105 group-hover:shadow-lg ${isUploadingImage ? 'opacity-60' : ''}`}
                  />
                  {isUploadingImage && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-green-500 rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-300 shadow-lg hover:scale-110 hover:shadow-xl"
                  title="Change profile picture"
                >
                  <Camera className={`w-4 h-4 transition-transform duration-300 ${isUploadingImage ? 'opacity-50' : 'hover:rotate-12'}`} />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="hidden"
              />
              <p className="text-sm text-slate-500 mt-2 transition-all duration-300 hover:text-slate-700">
                {isUploadingImage ? 'Uploading image...' : 'Click the camera icon to change your photo'}
              </p>
            </div>

            {/* Name Field */}
            <div className="animate-in slide-in-from-left duration-500 delay-100">
              <label className="block text-sm font-medium text-slate-700 mb-2 transition-all duration-300">
                <User className="w-4 h-4 inline mr-1 transition-transform duration-300 hover:scale-110" />
                Display Name
              </label>
              <input
                type="text"
                value={profileData.name}
                onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-all duration-300 focus:scale-105 focus:shadow-md"
                placeholder="Enter your name"
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="animate-in slide-in-from-right duration-500 delay-200">
              <label className="block text-sm font-medium text-slate-700 mb-2 transition-all duration-300">
                <Mail className="w-4 h-4 inline mr-1 transition-transform duration-300 hover:scale-110" />
                Email Address
              </label>
              <input
                type="email"
                value={profileData.email}
                disabled
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed transition-all duration-300"
              />
              <p className="text-xs text-slate-500 mt-1 transition-all duration-300 hover:text-slate-700">Email cannot be changed</p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-slate-200 flex gap-3 animate-in slide-in-from-bottom duration-500 delay-300">
            <button
              onClick={closeProfileModal}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-300 font-medium hover:scale-105 hover:shadow-md"
            >
              Cancel
            </button>
            <button
              onClick={updateProfile}
              disabled={isUpdatingProfile}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-300 font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
            >
              {isUpdatingProfile ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 transition-transform duration-300 hover:scale-110" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Premium Modal */}
      <div className={`fixed inset-0 backdrop-blur-md bg-white bg-opacity-20 flex items-center justify-center z-[100] transition-all duration-500 ease-in-out ${showPremiumModal
        ? 'opacity-100 visible'
        : 'opacity-0 invisible'
        }`}>
        <div className={`bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto transition-all duration-500 ease-in-out transform ${showPremiumModal
          ? 'scale-100 translate-y-0 opacity-100'
          : 'scale-75 translate-y-8 opacity-0'
          }`}>
          {/* Modal Header */}
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Crown className="w-6 h-6 text-yellow-500" />
              Premium Subscription
            </h2>
          </div>

          {/* Modal Content */}
          <div className="p-6">
            {hasPremium ? (
              <div>
                <p className="text-lg text-gray-700 mb-4">
                  Your premium subscription is active until {premiumUntil?.toLocaleDateString()}.
                </p>
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
                <p className="text-lg text-gray-700 mb-4">
                  Upgrade to Premium to unlock all features!
                </p>
                <div className="flex flex-col gap-4">
                  <h3 className="font-semibold text-gray-900">Premium Features:</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-700">
                    <li>Advanced expense analytics</li>
                    <li>Unlimited expense history</li>
                    <li>Priority support</li>
                    <li>Export reports</li>
                  </ul>
                  <Link href="/upgrade" className="text-blue-600 hover:underline">

                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-all transform hover:scale-105">
                      Upgrade Now
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-6 border-t border-slate-200">
            <button
              onClick={() => setShowPremiumModal(false)}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-300 font-medium hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="transition-all duration-300">
        <Expenses user={user} />
      </main>
    </div>
  )
}