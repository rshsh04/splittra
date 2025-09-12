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
    <header className="bg-base-300 lg:px-45 md:px-20 px-10 py-3 flex flex-row justify-between items-center shadow-md w-full">
      {/* Logo */}
      <div className="flex items-center gap-2">
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
      </div>

      {/* Navigation buttons */}
      <div className="flex flex-row gap-2 items-center">
        <button
          className="btn btn-neutral rounded-md text-base-100 hover:bg-accent-focus px-3 py-1 text-sm"
          onClick={handleRedirect}
        >
          Dashboard
        </button>
        <Link href="/support">
          <button className="btn btn-ghost rounded-md text-neutral hover:bg-base-200 px-3 py-1 text-sm">
            Support
          </button>
        </Link>
      </div>
    </header>
  )
}
