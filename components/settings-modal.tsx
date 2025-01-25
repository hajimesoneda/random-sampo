"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

const spotCategories = [
  { id: "cafe", label: "カフェ" },
  { id: "restaurant", label: "レストラン" },
  { id: "public_bath", label: "銭湯" },
  { id: "tourist_attraction", label: "観光スポット" },
]

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (categories: string[]) => void
  initialCategories: string[]
}

export function SettingsModal({ isOpen, onClose, onSave, initialCategories }: SettingsModalProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories)

  useEffect(() => {
    setSelectedCategories(initialCategories)
  }, [initialCategories])

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategories((prev) => {
      const updated = prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId]

      // 少なくとも1つのカテゴリーが選択されていることを確認
      return updated.length > 0 ? updated : prev
    })
  }

  const handleSave = () => {
    onSave(selectedCategories)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

