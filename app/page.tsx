import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]/auth-options"
import ClientHome from "./components/ClientHome"

export default async function Home() {
  const session = await getServerSession(authOptions)

  return <ClientHome initialSession={session} />
}

