import { ref } from 'vue'

export function useDragDrop() {
  const draggedItem = ref(null)
  const draggedIndex = ref(null)
  const dropTargetIndex = ref(null)

  function handleDragStart(item, index) {
    draggedItem.value = item
    draggedIndex.value = index
  }

  function handleDragOver(event, index) {
    event.preventDefault()
    dropTargetIndex.value = index
  }

  function handleDragLeave() {
    dropTargetIndex.value = null
  }

  function handleDrop(event, items, onReorder) {
    event.preventDefault()
    
    if (draggedIndex.value === null || dropTargetIndex.value === null) {
      return
    }

    if (draggedIndex.value === dropTargetIndex.value) {
      draggedItem.value = null
      draggedIndex.value = null
      dropTargetIndex.value = null
      return
    }

    // Reorder items
    const newItems = [...items]
    const [removed] = newItems.splice(draggedIndex.value, 1)
    newItems.splice(dropTargetIndex.value, 0, removed)

    // Call callback with new order
    if (onReorder) {
      onReorder(newItems)
    }

    // Reset
    draggedItem.value = null
    draggedIndex.value = null
    dropTargetIndex.value = null
  }

  function handleDragEnd() {
    draggedItem.value = null
    draggedIndex.value = null
    dropTargetIndex.value = null
  }

  return {
    draggedItem,
    draggedIndex,
    dropTargetIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  }
}
