import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/auth-options"
import ClientHome from "./components/ClientHome"
import { redirect } from "next/navigation"

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions)
  const isGuest = searchParams.guest === "true"

  if (!session && !isGuest) {
    redirect("/login")
  }

  return <ClientHome session={session} isGuest={isGuest} />
}

