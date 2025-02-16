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
  const [newCategoryId, setNewCategoryId] = useState("")
  const { status } = useSession()

  useEffect(() => {
    setCategories(initialCategories)
    setCustomCategories(
      initialCategories.filter((cat) => !Object.values(categoryMapping).some((defaultCat) => defaultCat.id === cat.id)),
    )
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
    if (newCategoryId.trim() && customCategories.length < 4) {
      const newCategory: Category = { id: newCategoryId.trim() }
      setCustomCategories((prev) => [...prev, newCategory])
      setCategories((prev) => [...prev, newCategory])
      setNewCategoryId("")
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
            <div key={category.id} className="flex items-center">
              <Checkbox
                id={category.id}
                checked={categories.some((cat) => cat.id === category.id)}
                onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                disabled={categories.length >= 4 && !categories.some((cat) => cat.id === category.id)}
              />
              <label htmlFor={category.id} className="ml-2">
                {category.id}
              </label>
            </div>
          ))}
          {customCategories.map((category) => (
            <div key={category.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <Checkbox
                  id={category.id}
                  checked={categories.some((cat) => cat.id === category.id)}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked)}
                  disabled={categories.length >= 4 && !categories.some((cat) => cat.id === category.id)}
                />
                <label htmlFor={category.id} className="ml-2">
                  {category.id}
                </label>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCustomCategory(category.id)}
                aria-label={`Remove ${category.id} category`}
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
                value={newCategoryId}
                onChange={(e) => setNewCategoryId(e.target.value)}
              />
              <Button onClick={handleAddCustomCategory} disabled={!newCategoryId.trim() || categories.length >= 4}>
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

