import type { VisitInfo, FavoriteStation } from "@/types/station"

const VISITS_KEY = "guestVisits"
const FAVORITES_KEY = "guestFavorites"

export const saveVisitToLocalStorage = (visit: VisitInfo) => {
  const visits = getVisitsFromLocalStorage()
  visits.push(visit)
  localStorage.setItem(VISITS_KEY, JSON.stringify(visits))
}

export const getVisitsFromLocalStorage = (): VisitInfo[] => {
  const visitsJson = localStorage.getItem(VISITS_KEY)
  return visitsJson ? JSON.parse(visitsJson) : []
}

export const saveFavoriteToLocalStorage = (favorite: FavoriteStation) => {
  const favorites = getFavoritesFromLocalStorage()
  const index = favorites.findIndex((f) => f.id === favorite.id)
  if (index === -1) {
    favorites.push(favorite)
  } else {
    favorites.splice(index, 1)
  }
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites))
}

export const getFavoritesFromLocalStorage = (): FavoriteStation[] => {
  const favoritesJson = localStorage.getItem(FAVORITES_KEY)
  return favoritesJson ? JSON.parse(favoritesJson) : []
}

export const clearGuestData = () => {
  localStorage.removeItem(VISITS_KEY)
  localStorage.removeItem(FAVORITES_KEY)
}

