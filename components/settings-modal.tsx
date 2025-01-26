"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Category {
  id: string
  label: string
}

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onCategoryChange: (categories: Category[]) => void
  initialCategories: Category[]
}

export function SettingsModal({ isOpen, onClose, onCategoryChange, initialCategories }: SettingsModalProps) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [newCategory, setNewCategory] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const handleAddCategory = () => {
    if (newCategory && categories.length < 8) {
      const newId = newCategory.toLowerCase().replace(/\s+/g, "_")
      const isDuplicate = categories.some((category) => category.label.toLowerCase() === newCategory.toLowerCase())

      if (isDuplicate) {
        setError("同じ名前のカテゴリーは追加できません。")
        return
      }

      const updatedCategories = [...categories, { id: newId, label: newCategory }]
      setCategories(updatedCategories)
      setNewCategory("")
      setError(null)
      onCategoryChange(updatedCategories)
      localStorage.setItem("selectedSpotCategories", JSON.stringify(updatedCategories))
    }
  }

  const handleAddButtonClick = () => {
    handleAddCategory()
  }

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddCategory()
    }
  }

  const handleRemoveCategory = (id: string) => {
    if (categories.length > 1) {
      const updatedCategories = categories.filter((category) => category.id !== id)
      setCategories(updatedCategories)
      onCategoryChange(updatedCategories)
      localStorage.setItem("selectedSpotCategories", JSON.stringify(updatedCategories))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">表示するスポットのカテゴリー</h2>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center bg-secondary px-3 py-1 rounded-full">
                <span className="text-sm font-medium mr-2">{category.label}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveCategory(category.id)}
                  className="h-6 w-6 p-0"
                  disabled={categories.length === 1}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="flex items-center space-x-2 mt-4">
            <Input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="新しいカテゴリー"
              className="flex-grow"
            />
            <Button onClick={handleAddButtonClick} disabled={!newCategory || categories.length >= 8}>
              <Plus className="h-4 w-4 mr-2" />
              追加
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

