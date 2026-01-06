import { ref, watch } from 'vue'

const SEARCH_HISTORY_KEY = 'convenience-store-search-history'
const MAX_HISTORY = 10

export function useSearchHistory() {
  const searchHistory = ref(
    JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]')
  )

  // Save to localStorage when history changes
  watch(
    searchHistory,
    (newHistory) => {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory))
    },
    { deep: true }
  )

  // Add search term to history
  const addToHistory = (term) => {
    if (!term || term.trim().length === 0) return

    const trimmedTerm = term.trim()
    
    // Remove if already exists
    const index = searchHistory.value.indexOf(trimmedTerm)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }

    // Add to beginning
    searchHistory.value.unshift(trimmedTerm)

    // Limit size
    if (searchHistory.value.length > MAX_HISTORY) {
      searchHistory.value = searchHistory.value.slice(0, MAX_HISTORY)
    }
  }

  // Remove specific term
  const removeFromHistory = (term) => {
    const index = searchHistory.value.indexOf(term)
    if (index > -1) {
      searchHistory.value.splice(index, 1)
    }
  }

  // Clear all history
  const clearHistory = () => {
    searchHistory.value = []
  }

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  }
}
