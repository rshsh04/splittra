"use client"
import { useEffect, useRef, useState } from "react"
import { Edit2, LogOut, Crown } from "lucide-react"
import { toast } from "react-toastify"

interface HouseholdComponentProps {
  user: any
}

export default function HouseholdComponent({ user }: HouseholdComponentProps) {
  const [householdName, setHouseholdName] = useState("Household")
  const [householdCode, setHouseholdCode] = useState("")
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [householdOwnerId, setHouseholdOwnerId] = useState<string>("")
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isSavingName, setIsSavingName] = useState(false)
  const [processingRemoveId, setProcessingRemoveId] = useState<string | null>(null)
  const [isLeaving, setIsLeaving] = useState(false)
  const nameInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const fetchHousehold = async () => {
      const household_id = user?.household_id
      setLoadError(null)
      if (!household_id) {
        setIsLoading(false)
        return
      }
      let mounted = true
      try {
        const supabase = require('@/lib/supabase/client').createClient();
        const { data: household, error: hhErr } = await supabase
          .from('household')
          .select('*')
          .eq('id', household_id)
          .maybeSingle();
        if (hhErr) throw hhErr
        if (!household) {
          if (mounted) setIsLoading(false)
          return
        }
        if (!mounted) return
        setHouseholdName(household.household_name || household.householdName || "Household")
        setHouseholdCode(household.code || "")
        const ownerId = household.owner_id ?? household.ownerId ?? household.owner
        setHouseholdOwnerId(ownerId ? String(ownerId) : "")
        if (Array.isArray(household.members) && household.members.length > 0) {
          const { data: users, error: usersErr } = await supabase
            .from('users')
            .select('id, name, email, profilePicture')
            .in('id', household.members)
          if (usersErr) throw usersErr
          if (!mounted) return
          setHouseholdMembers((users || []).map((u: any) => ({ ...u, id: String(u.id) })))
        } else {
          setHouseholdMembers([])
        }
      } catch (e) {
        console.error('fetchHousehold error', e)
        setLoadError('Failed to load household data.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchHousehold()
    return () => {
      // Mark as unmounted to avoid setting state after unmount
    }
  }, [user?.household_id])

  useEffect(() => {
    if (isEditingName) {
      setTimeout(() => nameInputRef.current?.focus(), 0)
    }
  }, [isEditingName])

  const startEditingName = () => {
    setEditNameValue(householdName)
    setIsEditingName(true)
  }
  const cancelEditingName = () => {
    setIsEditingName(false)
    setEditNameValue("")
  }
  const handleNameKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveHouseholdName()
    if (e.key === 'Escape') cancelEditingName()
  }
  const saveHouseholdName = async () => {
    try {
      const nextName = editNameValue.trim()
      if (!nextName) {
        toast.error('Household name cannot be empty')
        return
      }
      if (nextName.length > 60) {
        toast.error('Household name is too long (max 60)')
        return
      }
      if (nextName === householdName) {
        setIsEditingName(false)
        setEditNameValue("")
        return
      }
      setIsSavingName(true)
      const supabase = require('@/lib/supabase/client').createClient();
      let { error } = await supabase.from('household').update({ household_name: nextName }).eq('id', user?.household_id)
      if (error) {
        const res2 = await supabase.from('household').update({ householdName: nextName }).eq('id', user?.household_id)
        if (res2.error) throw res2.error
      }
      setHouseholdName(nextName)
      setIsEditingName(false)
      toast.success('Household name updated', { position: 'top-center', autoClose: 1500 })
    } catch (e) {
      console.error('saveHouseholdName error', e)
      toast.error('Failed to update name')
    } finally {
      setIsSavingName(false)
    }
  }

  const copyHouseholdCode = async () => {
    try {
      if (!householdCode) return
      if (navigator?.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(householdCode)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = householdCode
        textarea.style.position = 'fixed'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      toast.success('Invite code copied', { position: 'top-center', autoClose: 1200 })
    } catch (e) {
      toast.error('Copy failed')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      if (String(user?.id) !== String(householdOwnerId)) {
        toast.error('Only the owner can remove members')
        return
      }
      if (String(memberId) === String(householdOwnerId)) {
        toast.error('Cannot remove the owner')
        return
      }
      if (processingRemoveId) return
      setProcessingRemoveId(String(memberId))
      const supabase = require('@/lib/supabase/client').createClient();
      const newMembers = householdMembers.filter((m) => String(m.id) !== String(memberId)).map((m) => m.id)
      const { error: hErr } = await supabase.from('household').update({ members: newMembers }).eq('id', user.household_id)
      if (hErr) throw hErr
      const { error: uErr } = await supabase.from('users').update({ household_id: null }).eq('id', memberId)
      if (uErr) throw uErr
      setHouseholdMembers((prev) => prev.filter((m) => String(m.id) !== String(memberId)))
      setPendingRemoveId(null)
      toast.success('Member removed!', { position: 'top-center', autoClose: 1500 })
    } catch (e) {
      console.error('remove member error', e)
      toast.error('Failed to remove member')
      setPendingRemoveId(null)
    } finally {
      setProcessingRemoveId(null)
    }
  }

  const handleLeaveHousehold = async () => {
    try {
      const hasOthers = householdMembers.some(m => String(m.id) !== String(user?.id))
      const isOwner = String(user?.id) === String(householdOwnerId)
      const baseMsg = 'Are you sure you want to leave the household?'
      const ownerMsg = 'You are the owner. Leaving may affect other members. Proceed?'
      if (!confirm(isOwner && hasOthers ? ownerMsg : baseMsg)) return
      if (isLeaving) return
      setIsLeaving(true)
      const supabase = require('@/lib/supabase/client').createClient();
      const newMembers = householdMembers.filter((m) => String(m.id) !== String(user.id)).map((m) => m.id)
      const { error: hErr } = await supabase.from('household').update({ members: newMembers }).eq('id', user.household_id)
      if (hErr) throw hErr
      const { error: uErr } = await supabase.from('users').update({ household_id: null }).eq('id', user.id)
      if (uErr) throw uErr
      toast.success('You left the household', { position: 'top-center', autoClose: 1500 })
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e) {
      console.error('leave household error', e)
      toast.error('Failed to leave household')
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <div className="rounded-lg border bg-white">
      <div className="p-4 border-b">
        {isEditingName ? (
          <div className="flex items-center gap-2 w-full">
            <input
              ref={nameInputRef}
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={handleNameKeyPress}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button disabled={isSavingName} onClick={saveHouseholdName} className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm">{isSavingName ? 'Saving…' : 'Save'}</button>
            <button disabled={isSavingName} onClick={cancelEditingName} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded-md text-sm">Cancel</button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="font-medium truncate">{householdName}</div>
            {String(user?.id) === String(householdOwnerId) && (
              <button onClick={startEditingName} title="Edit household name" className="p-2 rounded hover:bg-slate-100">
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="text-sm text-slate-500">Loading household…</div>
        )}
        {loadError && !isLoading && (
          <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{loadError}</div>
        )}
        <div className="font-semibold text-slate-800 mb-2">Members</div>
        <ul className="space-y-2">
          {householdMembers.map((member) => (
            <li key={member.id} className={`flex items-center justify-between p-2 rounded-md border ${String(member.id) === String(householdOwnerId) ? 'bg-white border-gray-300' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <img src={member.profilePicture || "/default-avatar.jpg"} alt={member.name} className="w-8 h-8 rounded-full border" />
                <span className={`font-medium ${String(member.id) === String(householdOwnerId) ? 'text-yellow-700' : 'text-slate-800'}`}>{member.name || member.email}</span>
                {String(member.id) === String(householdOwnerId) && <Crown className="w-4 h-4 text-yellow-500" />}
              </div>
              {String(user?.id) === String(householdOwnerId) && String(member.id) !== String(householdOwnerId) && (
                pendingRemoveId === String(member.id) ? (
                  <button
                    disabled={processingRemoveId === String(member.id)}
                    className="text-red-600 bg-red-100 border border-red-300 px-2 py-1 rounded font-bold disabled:opacity-50"
                    onClick={() => handleRemoveMember(String(member.id))}
                  >
                    {processingRemoveId === String(member.id) ? 'Removing…' : 'Sure?'}
                  </button>
                ) : (
                  <button className="text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 bg-red-50 hover:bg-red-100" onClick={() => setPendingRemoveId(String(member.id))}>Remove</button>
                )
              )}
            </li>
          ))}
          {householdMembers.length === 0 && <li className="text-slate-500 text-sm">No members found</li>}
        </ul>

        {householdCode && (
          <button className="w-full text-left px-3 py-2 mt-3 hover:bg-slate-50 text-slate-700 border rounded-md" onClick={copyHouseholdCode}>
            <div className="flex items-center justify-between">
              <span className="text-sm">Invite Code</span>
              <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{householdCode}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Click to copy</div>
          </button>
        )}

        <div className="mt-4 border-t pt-3">
          <button disabled={isLeaving} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-md flex items-center gap-3" onClick={handleLeaveHousehold}>
            <LogOut className="w-4 h-4" /> {isLeaving ? 'Leaving…' : 'Leave Household'}
          </button>
        </div>
      </div>
    </div>
  )
}
