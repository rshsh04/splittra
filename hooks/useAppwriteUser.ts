import { useEffect, useState } from 'react'
import { account, databases, ID, Query } from '@/lib/appwrite'

export default function useAppwriteUser() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initUser = async () => {
      try {
        const sessionUser = await account.get() // throws if not logged in

        // Fetch user document from the Users collection
        const result = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
          process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
          [Query.equal('$id', sessionUser.$id)]
        )

        let userDoc
        if (result.documents.length === 0) {
          // Create if missing
          userDoc = await databases.createDocument(
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE!,
            process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
            sessionUser.$id,
            {
              name: sessionUser.name || '',
              email: sessionUser.email,
              householdId: null,
              isPremium: true,
              premiumUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            }
          )
        } else {
          userDoc = result.documents[0]
        }

        // Merge account + custom fields
        setUser({ ...sessionUser, ...userDoc })
      } catch (err: any) {
        console.error('Error fetching user:', err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    initUser()
  }, [])

  return { user, loading }
}
