'use client'
import { ReactNode, useState } from 'react'
import { databases, ID, Query } from '@/lib/appwrite'
export default function HouseholdSetup({ user, children }: { user: any; children?: ReactNode }) {
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [friendCode, setFriendCode] = useState('')

const handleCreateHousehold = async () => {
try {
    if (!user) return

    // 1. Check if user already owns a household
    const existing = await databases.listDocuments({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
      queries: [Query.equal('ownerId', [user.$id])]
    })

    if (existing.documents.length > 0) {
      // User already has a household, show existing code
      const household = existing.documents[0]
      setInviteCode(household.code)
      alert(`You already have a household! Invite code: ${household.code}`)
      return
    }

    // 2. User has no household → create a new one
    const code = Math.random().toString(36).substring(2, 7).toUpperCase()

    const household = await databases.createDocument({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
      documentId: ID.unique(),
      data: {
        code,
        ownerId: user.$id,
        members: [user.$id],
      },
    })
    // Update user's householdId
    await databases.updateDocument({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
      documentId: user.$id,
      data: { householdId: household.$id },
    })

    setInviteCode(household.code)
    alert(`Household created! Invite code: ${household.code}`)

  } catch (err: any) {
    console.error('Error creating household:', err)
    alert(`Failed to create household: ${err.message || err}`)
  }
}




 const handleJoinHousehold = async () => {
  try {
    if (!friendCode) return alert('Please enter a code.')

    // Check if user is already in a household
    if (user.householdId) return alert('You are already in a household!')

    // Find household by code
    const result = await databases.listDocuments({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
      queries: [Query.equal('code', [friendCode.toUpperCase()])],
    })

    if (result.documents.length === 0) return alert('Invalid code.')

    const household = result.documents[0]



    // Add current user to members
    const updatedHousehold = await databases.updateDocument({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
      documentId: household.$id,
      data: { members: [...household.members, user.$id] },
    })

    // Update user's householdId
    await databases.updateDocument({
      databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
      collectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
      documentId: user.$id,
      data: { householdId: updatedHousehold.$id },
    })

    setInviteCode(updatedHousehold.code)
    alert('You joined the household!')
    window.location.reload()

  } catch (err: any) {
    console.error('Error joining household:', err)
    alert(err.message || 'Failed to join household.')
  }
}



  return (
    <main className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-center">
         Welcome {user?.name || user?.email || 'Guest'}
      </h1>

      <div className="mb-8 p-4 bg-white shadow rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Create a Household</h2>
        <button
          onClick={handleCreateHousehold}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
        >
          Create Household
        </button>
        {inviteCode && (
          <div className="mt-4 flex items-center justify-between bg-gray-100 p-2 rounded-lg">
            <span className="font-mono text-lg">{inviteCode}</span>
            <button
              onClick={() => navigator.clipboard.writeText(inviteCode)}
              className="text-sm px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
            >
              Copy
            </button>
          </div>
        )}
      </div>

      <div className="p-4 bg-white shadow rounded-xl">
        <h2 className="text-lg font-semibold mb-2">Join a Household</h2>
        <input
          type="text"
          placeholder="Enter code..."
          value={friendCode}
          onChange={(e) => setFriendCode(e.target.value)}
          className="w-full border px-3 py-2 rounded-lg mb-3 focus:ring focus:ring-blue-300"
        />
        <button
          onClick={handleJoinHousehold}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
        >
          Join Household
        </button>
      </div>
    </main>
  )
}

