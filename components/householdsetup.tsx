'use client'
import { ReactNode, useState } from 'react'
import { databases, ID, Query } from '@/lib/appwrite'
import { Home, Users, Copy, Plus } from 'lucide-react'
import Header from './header';

export default function HouseholdSetup({ user, children }: { user: any; children?: ReactNode }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [friendCode, setFriendCode] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const handleCreateHousehold = async () => {
    setIsCreating(true)
    try {
      if (!user) return
      
      // Check if user already has a household
      const existing = await databases.listDocuments({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        queries: [Query.equal('ownerId', [user.$id])]
      })
      
      if (existing.documents.length > 0) {
        const household = existing.documents[0]
        setInviteCode(household.code)
        return
      }

      // Create new household
      const code = Math.random().toString(36).substring(2, 7).toUpperCase()
      const household = await databases.createDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        documentId: ID.unique(),
        data: { 
          code, 
          ownerId: user.$id, 
          members: [user.$id],
          householdName: `${user.name}'s Household`
        }
      })
      
      await databases.updateDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
        documentId: user.$id,
        data: { householdId: household.$id }
      })
      
      setInviteCode(household.code)
    } catch (err: any) {
      console.error('Error creating household:', err)
      alert(`Failed to create household: ${err.message || err}`)
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinHousehold = async () => {
    if (!friendCode.trim()) {
      alert('Please enter an invite code.')
      return
    }
    
    if (user.householdId) {
      alert('You are already in a household!')
      return
    }

    setIsJoining(true)
    try {
      const result = await databases.listDocuments({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        queries: [Query.equal('code', [friendCode.toUpperCase()])]
      })
      
      if (result.documents.length === 0) {
        alert('Invalid invite code. Please check and try again.')
        return
      }
      
      const household = result.documents[0]
      
      // Check if user is already a member
      if (household.members.includes(user.$id)) {
        alert('You are already a member of this household!')
        return
      }
      
      const updatedHousehold = await databases.updateDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        documentId: household.$id,
        data: { members: [...household.members, user.$id] }
      })
      
      await databases.updateDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
        documentId: user.$id,
        data: { householdId: updatedHousehold.$id }
      })
      
      window.location.reload()
    } catch (err: any) {
      console.error('Error joining household:', err)
      alert(err.message || 'Failed to join household.')
    } finally {
      setIsJoining(false)
    }
  }

  const handleCopyCode = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode)
      setCodeCopied(true)
      setTimeout(() => setCodeCopied(false), 2000)
    }
  }

  return (
    <>
    <Header/>
    <div className="min-h-screen bg-base-300 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        {/* Header */}
        <div className="text-center p-8 pb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Welcome {user?.name?.split(' ')[0] || 'User'}!
          </h1>
          <p className="text-slate-600">Set up your household to start tracking expenses</p>
        </div>

        <div className="px-8 pb-8 space-y-6">
          {/* Create Household */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Create New Household</h2>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Start fresh with a new household and invite family members or roommates to join.
            </p>
            
            <button
              onClick={handleCreateHousehold}
              disabled={isCreating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed"
            >
              {isCreating ? 'Creating...' : 'Create Household'}
            </button>
            
            {inviteCode && (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-slate-800">Your Invite Code:</div>
                <div className="flex items-center justify-between bg-white border border-slate-300 rounded-lg p-3">
                  <span className="font-mono text-lg text-slate-800 tracking-wider">{inviteCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    {codeCopied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Share this code with household members so they can join your household.
                </p>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-slate-300"></div>
            <span className="px-4 text-sm text-slate-500 bg-white">or</span>
            <div className="flex-1 border-t border-slate-300"></div>
          </div>

          {/* Join Household */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">Join Existing Household</h2>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">
              Have an invite code? Enter it below to join an existing household.
            </p>
            
            <input
              type="text"
              placeholder="Enter invite code (e.g., ABC12)"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              className="w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono tracking-wider text-center"
              maxLength={5}
            />
            
            <button
              onClick={handleJoinHousehold}
              disabled={isJoining || !friendCode.trim()}
              className="w-full bg-slate-600 hover:bg-slate-700 disabled:bg-slate-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:cursor-not-allowed"
            >
              {isJoining ? 'Joining...' : 'Join Household'}
            </button>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}