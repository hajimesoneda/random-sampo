import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/auth-options"
import ClientHome from "./components/ClientHome"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return <ClientHome session={session} />
}

