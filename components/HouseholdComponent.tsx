"use client"
import { useEffect, useRef, useState } from "react"
import { Edit2, LogOut, Crown, MoreVertical } from "lucide-react"
import { toast, ToastContainer } from "react-toastify"
import { useI18n } from "@/lib/i18n/LocaleProvider"

interface HouseholdComponentProps {
  user: any
}

export default function HouseholdComponent({ user }: HouseholdComponentProps) {
  const { t } = useI18n()
  const [householdName, setHouseholdName] = useState("Household")
  const [householdCode, setHouseholdCode] = useState("")
  const [householdMembers, setHouseholdMembers] = useState<any[]>([])
  const [householdOwnerId, setHouseholdOwnerId] = useState<string>("")
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editNameValue, setEditNameValue] = useState("")
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmState, setConfirmState] = useState<{ type: 'remove' | 'transfer' | 'leave' | null, memberId?: string, memberName?: string }>({ type: null })
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
  setHouseholdName(household.household_name || household.householdName || t('defaultHouseholdName'))
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
  setLoadError(t('failedToLoadHouseholdData'))
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
        toast.error(t('householdNameEmpty'))
        return
      }
      if (nextName.length > 60) {
        toast.error(t('householdNameTooLong'))
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
      toast.success(t('householdNameUpdated'), { position: 'top-center', autoClose: 1500 })
    } catch (e) {
      console.error('saveHouseholdName error', e)
      toast.error(t('failedToUpdateName'))
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
      toast.success(t('inviteCodeCopied'), { position: 'top-center', autoClose: 1200 })
    } catch (e) {
      toast.error(t('copyFailed'))
    }
  }

  const copyInviteLink = async () => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      if (!householdCode) return
      const url = `${base}/join?code=${encodeURIComponent(householdCode)}`
      await navigator.clipboard.writeText(url)
      toast.success(t('inviteLinkCopied') || 'Invite link copied', { position: 'top-center', autoClose: 1200 })
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    try {
      if (String(user?.id) !== String(householdOwnerId)) {
        toast.error(t('onlyOwnerCanRemoveMembers'))
        return
      }
      if (String(memberId) === String(householdOwnerId)) {
        toast.error(t('cannotRemoveOwner'))
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
      toast.success(t('memberRemoved'), { position: 'top-center', autoClose: 1500 })
    } catch (e) {
      console.error('remove member error', e)
      toast.error(t('failedToRemoveMember'))
      setPendingRemoveId(null)
    } finally {
      setProcessingRemoveId(null)
    }
  }

  const handleTransferOwnership = async (memberId: string) => {
    try {
      if (String(user?.id) !== String(householdOwnerId)) {
        toast.error(t('onlyOwnerCanTransfer'))
        return
      }
      if (String(memberId) === String(householdOwnerId)) return
      const supabase = require('@/lib/supabase/client').createClient();
      const { error } = await supabase.from('household').update({ owner_id: memberId }).eq('id', user.household_id)
      if (error) throw error
      setHouseholdOwnerId(String(memberId))
      toast.success(t('ownershipTransferred'), { position: 'top-center', autoClose: 1500 })
    } catch (e) {
      console.error('transfer ownership error', e)
      toast.error(t('failedToTransferOwnership'))
    }
  }

  const handleLeaveHousehold = async () => {
    try {
      if (isLeaving) return
      setIsLeaving(true)
      const supabase = require('@/lib/supabase/client').createClient();
      const newMembers = householdMembers.filter((m) => String(m.id) !== String(user.id)).map((m) => m.id)
      const { error: hErr } = await supabase.from('household').update({ members: newMembers }).eq('id', user.household_id)
      if (hErr) throw hErr
      const { error: uErr } = await supabase.from('users').update({ household_id: null }).eq('id', user.id)
      if (uErr) throw uErr
      toast.success(t('youLeftHousehold'), { position: 'top-center', autoClose: 1500 })
      if (typeof window !== 'undefined') window.location.reload()
    } catch (e) {
      console.error('leave household error', e)
      toast.error(t('failedToLeaveHousehold'))
    } finally {
      setIsLeaving(false)
    }
  }

  return (
    <>
    <div className="rounded-lg border bg-white">
      <div className="p-4 border-b">
        <ToastContainer 
          position="top-center"
          autoClose={1500}
          theme="colored"/>
        {isEditingName ? (
          <div className="flex items-center gap-2 w-full">
            <input
              ref={nameInputRef}
              value={editNameValue}
              onChange={(e) => setEditNameValue(e.target.value)}
              onKeyDown={handleNameKeyPress}
              className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button disabled={isSavingName} onClick={saveHouseholdName} className="px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-md text-sm">{isSavingName ? t('saving') : t('save')}</button>
            <button disabled={isSavingName} onClick={cancelEditingName} className="px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 rounded-md text-sm">{t('cancelAction')}</button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="font-medium truncate">{householdName}</div>
            {String(user?.id) === String(householdOwnerId) && (
              <button onClick={startEditingName} title={t('editHouseholdName')} className="p-2 rounded hover:bg-slate-100">
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="p-4">
        {isLoading && (
          <div className="text-sm text-slate-500">{t('loadingHousehold')}</div>
        )}
        {loadError && !isLoading && (
          <div className="mb-3 p-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded">{loadError}</div>
        )}
        <div className="font-semibold text-slate-800 mb-2">{t('members')}</div>
        <ul className="space-y-2">
          {householdMembers.map((member) => (
            <li key={member.id} className={`flex items-center justify-between p-2 rounded-md border relative ${String(member.id) === String(householdOwnerId) ? 'bg-white border-gray-300' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-2">
                <img src={member.profilePicture || "/default-avatar.jpg"} alt={member.name} className="w-8 h-8 rounded-full border" />
                <span className={`font-medium ${String(member.id) === String(householdOwnerId) ? 'text-yellow-700' : 'text-slate-800'}`}>{member.name || member.email}</span>
                {String(member.id) === String(householdOwnerId) && <Crown className="w-4 h-4 text-yellow-500" />}
              </div>
              {String(user?.id) === String(householdOwnerId) && String(member.id) !== String(householdOwnerId) && (
                <div className="relative">
                  <button
                    className="p-2 rounded hover:bg-slate-100"
                    onClick={() => setMenuOpenId(prev => prev === String(member.id) ? null : String(member.id))}
                    aria-label="Member actions"
                  >
                    <MoreVertical className="w-5 h-5 text-slate-600" />
                  </button>
                  {menuOpenId === String(member.id) && (
                    <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-md shadow-md z-10">
                      <button
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                        onClick={() => { setConfirmState({ type: 'transfer', memberId: String(member.id), memberName: member.name || member.email }); setMenuOpenId(null) }}
                      >
                        {t('transferOwnership')}
                      </button>
                      <button
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => { setConfirmState({ type: 'remove', memberId: String(member.id), memberName: member.name || member.email }); setMenuOpenId(null) }}
                      >
                        {t('removeMember')}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </li>
          ))}
          {householdMembers.length === 0 && <li className="text-slate-500 text-sm">{t('noMembersFound')}</li>}
        </ul>

        {householdCode && (
          <button className="w-full text-left px-3 py-2 mt-3 hover:bg-slate-50 text-slate-700 border rounded-md" onClick={copyHouseholdCode}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{t('inviteCode')}</span>
              <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{householdCode}</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">{t('clickToCopy')}</div>
          </button>
        )}
        {householdCode && (
          <button className="w-full text-left px-3 py-2 mt-3 hover:bg-slate-50 text-slate-700 border rounded-md" onClick={copyInviteLink}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{t('copyInviteLink') || 'Copy Invite Link'}</span>
              </div>
              <span className="text-xs text-slate-500">{t('clickToCopy')}</span>
            </div>
          </button>
        )}

        <div className="mt-4 border-t pt-3">
          <button disabled={isLeaving} className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 rounded-md flex items-center gap-3" onClick={() => setConfirmState({ type: 'leave' })}>
            <LogOut className="w-4 h-4" /> {isLeaving ? t('leaving') : t('leaveHousehold')}
          </button>
        </div>
      </div>
    </div>
    {/* Confirm Modals */}
    {confirmState.type && (
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-lg shadow-lg border">
          <div className="p-4 border-b">
            {confirmState.type === 'remove' && <div className="text-base font-semibold">{t('removeMember')}</div>}
            {confirmState.type === 'transfer' && <div className="text-base font-semibold">{t('transferOwnership')}</div>}
            {confirmState.type === 'leave' && <div className="text-base font-semibold">{t('leaveHouseholdTitle')}</div>}
          </div>
          <div className="p-4 space-y-2 text-sm text-slate-700">
            {confirmState.type === 'remove' && (
              <p>{t('removeMemberConfirm')}<span className="font-medium">{confirmState.memberName}</span>{t('removeMemberConfirmSuffix')}</p>
            )}
            {confirmState.type === 'transfer' && (
              <p>{t('transferOwnershipConfirm')}<span className="font-medium">{confirmState.memberName}</span>{t('transferOwnershipConfirmSuffix')}</p>
            )}
            {confirmState.type === 'leave' && (
              <p>{t('leaveHouseholdConfirm')}</p>
            )}
          </div>
          <div className="p-4 border-t flex justify-end gap-2">
            <button className="px-3 py-2 text-sm rounded-md border hover:bg-slate-50" onClick={() => setConfirmState({ type: null })}>{t('cancel')}</button>
            {confirmState.type === 'remove' && (
              <button className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700" onClick={async () => { await handleRemoveMember(String(confirmState.memberId)); setConfirmState({ type: null }) }}>{t('removeMember')}</button>
            )}
            {confirmState.type === 'transfer' && (
              <button className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700" onClick={async () => { await handleTransferOwnership(String(confirmState.memberId)); setConfirmState({ type: null }) }}>{t('transferOwnership')}</button>
            )}
            {confirmState.type === 'leave' && (
              <button disabled={isLeaving} className="px-3 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50" onClick={async () => { await handleLeaveHousehold(); setConfirmState({ type: null }) }}>{t('leaveHousehold')}</button>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  )
}
