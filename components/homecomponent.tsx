"use client"
import { useState, useEffect, useRef } from "react"
import { account, databases, Query } from "@/lib/appwrite"
import Expenses from "./expenses"

export default function HomeComponent({ user }: { user: any }) {
  const [householdName, setHouseholdName] = useState("Household")
  const [householdCode, setHouseholdCode] = useState("")
  const [showHouseholdDropdown, setShowHouseholdDropdown] = useState(false)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false)

  const householdRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE!
  const householdsCollection = process.env.NEXT_PUBLIC_APPWRITE_HOUSEHOLDS_COLLECTION!

  useEffect(() => {
    const fetchHousehold = async () => {
      if (!user?.householdId) return

      try {
        const res = await databases.getDocument(databaseId, householdsCollection, user.householdId)
        setHouseholdName(res.householdName || "Household")
        setHouseholdCode(res.code || "")
      } catch (err) {
        console.error("Error fetching household:", err)
      }
    }

    fetchHousehold()
  }, [user?.householdId])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (householdRef.current && !householdRef.current.contains(event.target as Node)) {
        setShowHouseholdDropdown(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await account.deleteSession("current")
    window.location.reload()
  }

  const handleLeaveHousehold = async () => {
    if (!user?.householdId) return

    try {
      const household = await databases.getDocument(databaseId, householdsCollection, user.householdId)

      await databases.updateDocument(databaseId, householdsCollection, household.$id, {
        members: household.members.filter((m: string) => m !== user.$id)
      })

      await databases.updateDocument(
        databaseId,
        process.env.NEXT_PUBLIC_APPWRITE_USERS_COLLECTION!,
        user.$id,
        { householdId: null }
      )

      window.location.reload()
    } catch (err) {
      console.error("Error leaving household:", err)
      alert("Failed to leave household.")
    }
  }

  const handleChangeHouseholdName = async () => {
    const newName = prompt("Enter new household name:", householdName)
    if (!newName) return

    try {
      await databases.updateDocument(databaseId, householdsCollection, user.householdId, {
        householdName: newName
      })
      setHouseholdName(newName)
    } catch (err) {
      console.error("Error updating household name:", err)
      alert("Failed to update household name")
    }
  }

  const renderNavBar = () => (
    <div className="flex items-center justify-between sticky top-0 bg-transparent px-48 py-4 shadow-md">
      {/* Logo */}
      <div className="text-white font-bold text-xl cursor-pointer">MyApp</div>

      {/* Right buttons */}
      <div className="flex items-center space-x-4 relative">
        {/* Household dropdown */}
        <div ref={householdRef} className="relative">
          <button
            className="px-4 py-2 rounded-md bg-transparent border border-gray-700 text-white hover:bg-gray-800 transition-colors"
            onClick={() => setShowHouseholdDropdown(!showHouseholdDropdown)}
          >
            {householdName}
          </button>
          {showHouseholdDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                onClick={handleChangeHouseholdName}
              >
                Change Household Name
              </button>
              <div className="px-4 py-2 text-gray-300 border-t border-gray-700">
                Household Code: <span className="font-bold text-white">{householdCode || "N/A"}</span>
              </div>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-red-400"
                onClick={handleLeaveHousehold}
              >
                Leave Household
              </button>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <img
            src={user?.profilePicture || "/default-avatar.jpg"}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer border-2 border-gray-700"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          />
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg z-50">
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors"
                onClick={() => (window.location.href = "/profile")}
              >
                Account Details
              </button>
              <button
                className="w-full text-left px-4 py-2 hover:bg-gray-700 transition-colors text-red-400"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950">
      {renderNavBar()}
      <div className="max-w-2xl mx-auto p-4">
        <Expenses user={user} />
      </div>
    </div>
  )
}
