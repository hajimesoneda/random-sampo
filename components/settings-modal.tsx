"use client"

import { useState, useEffect } from "react"
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
import { Input } from "@/components/ui/input"
import { categoryMapping } from "@/lib/category-mapping"
import type { Category } from "@/types/category"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoryChange: (categories: Category[]) => void
  initialCategories: Category[]
}

export function SettingsModal({ isOpen, onClose, onCategoryChange, initialCategories }: SettingsModalProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [customCategories, setCustomCategories] = useState<Category[]>([])
  const [newCategoryLabel, setNewCategoryLabel] = useState("")

  useEffect(() => {
    setCategories(initialCategories)
    setCustomCategories(initialCategories.filter((cat) => cat.id.startsWith("custom_")))
  }, [initialCategories])

  const handleCategoryChange = (id: string, checked: boolean | string) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories]
      const index = updatedCategories.findIndex((cat) => cat.id === id)
      if (Boolean(checked) && index === -1) {
        const category = [...Object.values(categoryMapping), ...customCategories].find((cat) => cat.id === id)
        if (category) {
          updatedCategories.push(category)
        }
      } else if (!Boolean(checked) && index !== -1) {
        updatedCategories.splice(index, 1)
      }
      return updatedCategories
    })
  }

  const handleAddCustomCategory = () => {
    if (newCategoryLabel.trim() && customCategories.length < 2) {
      const newCategory: Category = {
        id: `custom_${Date.now()}`,
        label: newCategoryLabel.trim(),
        type: newCategoryLabel.trim().toLowerCase().replace(/\s+/g, "_"),
      }
      setCustomCategories((prev) => [...prev, newCategory])
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryLabel("")
    }
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
          <DialogDescription>スポットのカテゴリーを選択してください（最大6つ）</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.values(categoryMapping).map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={categories.some((cat) => cat.id === category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                disabled={categories.length >= 6 && !categories.some((cat) => cat.id === category.id)}
              />
              <label htmlFor={category.id} className="ml-2">
                {category.label}
              </label>
            </div>
          ))}
          {customCategories.map((category) => (
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={categories.some((cat) => cat.id === category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                disabled={categories.length >= 6 && !categories.some((cat) => cat.id === category.id)}
              />
              <label htmlFor={category.id} className="ml-2">
                {category.label}
              </label>
            </div>
          ))}
          {customCategories.length < 2 && (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="カスタムカテゴリー"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
              />
              <Button onClick={handleAddCustomCategory} disabled={!newCategoryLabel.trim() || categories.length >= 6}>
                追加
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>キャンセル</Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

