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
import { useSession } from "next-auth/react"
import { X } from "lucide-react"

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
  const { status } = useSession()

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
    if (newCategoryLabel.trim() && customCategories.length < 4) {
      const newCategory: Category = {
        id: newCategoryLabel.trim(),
        label: newCategoryLabel.trim(),
        type: "point_of_interest",
      }
      setCustomCategories((prev) => [...prev, newCategory])
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryLabel("")
    }
  }

  const handleRemoveCustomCategory = (categoryId: string) => {
    setCustomCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
    setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
  }

  const handleClose = async () => {
    const hasChanges = JSON.stringify(categories) !== JSON.stringify(initialCategories)
    if (hasChanges) {
      if (status === "authenticated") {
        try {
          const response = await fetch("/api/categories", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              categories: categories.map((cat) => cat.id),
              customCategories: customCategories,
            }),
          })

          if (!response.ok) {
            throw new Error("Failed to save categories")
          }

          const data = await response.json()
          console.log("Updated categories:", data.categories)
          onCategoryChange(data.categories)
        } catch (error) {
          console.error("Error saving categories:", error)
        }
      } else {
        console.log("Updating categories for guest user:", categories)
        onCategoryChange(categories)
      }
    }
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
          <DialogDescription>スポットのカテゴリーを選択してください（最大4つ）</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {Object.values(categoryMapping).map((category) => (
            <div key={category.label} className="flex items-center">
              <Checkbox
                id={category.label}
                checked={categories.some((cat) => cat.label === category.label)}
                onCheckedChange={(checked) => handleCategoryChange(category.label, checked)}
                disabled={categories.length >= 4 && !categories.some((cat) => cat.label === category.label)}
              />
              <label htmlFor={category.label} className="ml-2">
                {category.label}
              </label>
            </div>
          ))}
          {customCategories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id={category.label}
                  checked={categories.some((cat) => cat.id === category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.label, checked)}
                  disabled={categories.length >= 4 && !categories.some((cat) => cat.id === category.id)}
                />
                <label htmlFor={category.label} className="ml-2">
                  {category.label}
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCustomCategory(category.id)}
                aria-label={`Remove ${category.label} category`}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {customCategories.length < 4 && (
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="カスタムカテゴリー"
                value={newCategoryLabel}
                onChange={(e) => setNewCategoryLabel(e.target.value)}
              />
              <Button onClick={handleAddCustomCategory} disabled={!newCategoryLabel.trim() || categories.length >= 4}>
                追加
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handleClose}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

