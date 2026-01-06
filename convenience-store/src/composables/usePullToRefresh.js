import { ref, onMounted, onUnmounted } from 'vue'

export function usePullToRefresh(onRefresh, options = {}) {
  const { threshold = 80, resistance = 2.5 } = options
  
  const isPulling = ref(false)
  const pullDistance = ref(0)
  const isRefreshing = ref(false)
  const containerRef = ref(null)
  
  let startY = 0
  let currentY = 0

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      startY = e.touches[0].clientY
      isPulling.value = true
    }
  }

  const handleTouchMove = (e) => {
    if (!isPulling.value || isRefreshing.value) return
    
    currentY = e.touches[0].clientY
    const diff = currentY - startY
    
    if (diff > 0 && window.scrollY === 0) {
      pullDistance.value = Math.min(diff / resistance, threshold * 1.5)
      
      if (pullDistance.value > 10) {
        e.preventDefault()
      }
    }
  }

  const handleTouchEnd = async () => {
    if (!isPulling.value) return
    
    if (pullDistance.value >= threshold && !isRefreshing.value) {
      isRefreshing.value = true
      pullDistance.value = threshold / 2
      
      try {
        await onRefresh()
      } finally {
        isRefreshing.value = false
      }
    }
    
    isPulling.value = false
    pullDistance.value = 0
  }

  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  })

  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  })

  return { isPulling, pullDistance, isRefreshing, containerRef }
}
