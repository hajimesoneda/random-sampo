"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoryChange: (categories: { id: string; label: string }[]) => void
  initialCategories: { id: string; label: string }[]
}

export function SettingsModal({ isOpen, onClose, onCategoryChange, initialCategories }: SettingsModalProps) {
  const [categories, setCategories] = useState(initialCategories)

  const handleCategoryChange = (id: string, checked: boolean | string) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories]
      const index = updatedCategories.findIndex((cat) => cat.id === id)
      if (Boolean(checked) && index === -1) {
        updatedCategories.push({ id, label: initialCategories.find((cat) => cat.id === id)?.label || id })
      } else if (!Boolean(checked) && index !== -1) {
        updatedCategories.splice(index, 1)
      }
      return updatedCategories
    })
  }

  const handleSave = () => {
    onCategoryChange(categories)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>スポットのカテゴリーを選択してください</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {initialCategories.map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={categories.some((cat) => cat.id === category.id)}
                onCheckedChange={(checked: boolean) => handleCategoryChange(category.id, checked)}
              />
              <label htmlFor={category.id} className="ml-2">
                {category.label}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

