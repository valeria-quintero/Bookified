'use client'
import { cn } from 'cn'
import { Show, SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
    { label: "Library", href: "/" },
    { label: "Add New", href: "/books/new" },
    { label: "Plans", href: "/subscriptions" },
]

const Navbar = () => {

    const pathName = usePathname();
    const { user } = useUser();

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary)">
        <div className="wrapper navbar-height py-4 flex justify-between items-center">
            <Link href="/" className="flex gap-0.5 items-center">
                <Image src="/assets/logo.png" alt="Bookfied" width={42} height={26} />
                <span className="logo-text">Bookified</span>
            </Link>

            <nav className="w-fit flex gap-7.5 items-center">
                {navItems.map(({ label, href }) => {
                    const isActive = pathName === href || (href !== '/' && pathName?.startsWith(href));
                    return (
                        <Link href={href} key={label} className={cn('nav-link-base', isActive ? 'nav-link-active' : 'text-black hover:opacity-70')}>
                            {label}
                        </Link>
                    );
                })}
                <div className="flex gap-7.5 items-center">
                    <Show when="signed-out">
                        <SignInButton mode="redirect">
                            <button className="nav-btn">Sign in</button>
                        </SignInButton>
                        <SignUpButton mode="redirect">
                            <button className="btn-primary px-4 py-2">Sign up</button>
                        </SignUpButton>
                    </Show>
                    <Show when="signed-in">
                        <div className="nav-user-link">
                            <UserButton />
                            {user?.firstName && (<span className="nav-user-name">
                                {user.firstName}
                            </span>)}
                        </div>
                    </Show>
                </div>
            </nav>
        </div>
    </header>
  )
}

export default Navbar