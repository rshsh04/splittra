import { account, databases, Query } from "@/lib/appwrite"

export default function HomeComponent({ user }: { user: any }) {

  const handleLogout = async () => {
    await account.deleteSession('current')
    window.location.reload()
  }
  const handleLeaveHousehold = async () => {
    // Logic to leave household
    if (!user || !user.householdId) return

    try {
      // Fetch household document
      const householdResult = await databases.listDocuments({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        queries: [Query.equal('members', [user.$id])]
      })

      if (householdResult.documents.length === 0) return alert('Household not found.')

      const household = householdResult.documents[0]

      // Remove current user from members
      const updatedHousehold = await databases.updateDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!,
        documentId: household.$id,
        data: { members: household.members.filter((member: string) => member !== user.$id) }
      })

      // Update user's householdId in the users collection
      await databases.updateDocument({
        databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
        collectionId: process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!, // Make sure this env variable exists
        documentId: user.$id,
        data: { householdId: null }
      })

      window.location.reload()
    } catch (error) {
      console.error('Error leaving household:', error)
      alert('Failed to leave household.') 
    }
  }

  return (
<>
    <div>Home Component</div>
    <div>User ID: {user.$id}</div>
    <div>Household ID: {user.householdId}</div>
    <button onClick={handleLogout}>Logout</button>
    <button onClick={handleLeaveHousehold}>Leave Household</button>
</>
  )
}
