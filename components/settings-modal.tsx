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
    setCustomCategories(
      initialCategories.filter(
        (cat) => !Object.values(categoryMapping).some((defaultCat) => defaultCat.label === cat.label),
      ),
    )
  }, [initialCategories])

  const handleCategoryChange = (label: string, checked: boolean | string) => {
    setCategories((prevCategories) => {
      const updatedCategories = [...prevCategories]
      const index = updatedCategories.findIndex((cat) => cat.label === label)
      if (Boolean(checked) && index === -1) {
        const category = [...Object.values(categoryMapping), ...customCategories].find((cat) => cat.label === label)
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
            <div key={category.label} className="flex items-center">
              <Checkbox
                id={category.label}
                checked={categories.some((cat) => cat.label === category.label)}
                onCheckedChange={(checked) => handleCategoryChange(category.label, checked)}
                disabled={categories.length >= 6 && !categories.some((cat) => cat.label === category.label)}
              />
              <label htmlFor={category.label} className="ml-2">
                {category.label}
              </label>
            </div>
          ))}
          {customCategories.map((category) => (
            <div key={category.label} className="flex items-center">
              <Checkbox
                id={category.label}
                checked={categories.some((cat) => cat.label === category.label)}
                onCheckedChange={(checked) => handleCategoryChange(category.label, checked)}
                disabled={categories.length >= 6 && !categories.some((cat) => cat.label === category.label)}
              />
              <label htmlFor={category.label} className="ml-2">
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

