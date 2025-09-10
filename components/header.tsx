'use client'
import useAppwriteUser from '@/hooks/useAppwriteUser'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Header() {
  const { user, loading } = useAppwriteUser()
  const router = useRouter()

  const handleRedirect = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/login')
    }
  }

  return (
    <header className="bg-base-300 px-6 py-4 flex justify-between px-40 items-center shadow-md">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logo.png"
          alt="Logo"
          width={100}
          height={40}
          className="object-contain"
          priority
        />
      </Link>

      {/* Navigation buttons */}
      <div className="flex flex-row gap-3">
        <button
          className="btn btn-neutral rounded-lg text-base-100 hover:bg-accent-focus"
          onClick={handleRedirect}
        >
          Dashboard
        </button>
        <Link href="/support">
          <button className="btn btn-ghost rounded-lg text-neutral hover:bg-base-200">
            Support
          </button>
        </Link>
      </div>
    </header>
  )
}
