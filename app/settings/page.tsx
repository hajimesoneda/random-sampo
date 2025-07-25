"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"

const spotCategories = [
  { id: "cafe", label: "カフェ" },
  { id: "restaurant", label: "レストラン" },
  { id: "public_bath", label: "銭湯" },
  { id: "tourist_attraction", label: "観光スポット" },
]

export default function SettingsPage() {
  const router = useRouter()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    const storedCategories = localStorage.getItem("selectedSpotCategories")
    if (storedCategories) {
      setSelectedCategories(JSON.parse(storedCategories))
    } else {
      setSelectedCategories(spotCategories.map((category) => category.id))
    }
  }, [])

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]

      // 少なくとも1つのカテゴリーが選択されていることを確認
      return updated.length > 0 ? updated : prev
    })
  }

  const handleSave = () => {
    localStorage.setItem("selectedSpotCategories", JSON.stringify(selectedCategories))
    router.push("/")
  }

  return (
    <main className="container max-w-md mx-auto p-4">
      <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        戻る
      </Button>

      <h1 className="text-2xl font-bold mb-4">設定</h1>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">表示するスポットのカテゴリー</h2>
        {spotCategories.map((category) => (
          <div key={category.id} className="flex items-center space-x-2">
            <Checkbox
              id={category.id}
              checked={selectedCategories.includes(category.id)}
              onCheckedChange={() => handleCategoryChange(category.id)}
            />
            <label
              htmlFor={category.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {category.label}
            </label>
          </div>
        ))}
      </div>

      <Button onClick={handleSave} className="mt-6 w-full">
        保存
      </Button>
    </main>
  )
}

