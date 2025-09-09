
export default function ProfilePage({ user }: { user: any }) {
  return (
    <div>
      <h1>Profile Page</h1>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
    </div>
  )
}