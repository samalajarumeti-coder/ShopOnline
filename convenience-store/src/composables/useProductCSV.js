import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export function useProductCSV() {
  const importing = ref(false)
  const exporting = ref(false)
  const progress = ref(0)
  const error = ref('')

  // Export products to CSV
  const exportToCSV = async (products) => {
    exporting.value = true
    error.value = ''
    
    try {
      // CSV Headers
      const headers = [
        'ID', 'Name (TH)', 'Name (EN)', 'Description', 'Price', 'Original Price',
        'Image', 'Category ID', 'Stock', 'Is Active', 'Is Flash Sale'
      ]

      // Convert products to CSV rows
      const rows = products.map(p => [
        p.id || '',
        p.name || '',
        p.name_en || '',
        (p.description || '').replace(/\n/g, ' ').replace(/"/g, '""'),
        p.price || '',
        p.original_price || '',
        p.image || '',
        p.category_id || '',
        p.stock || 0,
        p.is_active ? 'TRUE' : 'FALSE',
        p.is_flash_sale ? 'TRUE' : 'FALSE'
      ])

      // Create CSV content
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      // Download file
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `products_${Date.now()}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      return { success: true, count: products.length }
    } catch (err) {
      console.error('Export error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      exporting.value = false
    }
  }

  // Import products from CSV
  const importFromCSV = async (file) => {
    importing.value = true
    error.value = ''
    progress.value = 0

    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        throw new Error('ไฟล์ CSV ว่างเปล่าหรือไม่ถูกต้อง')
      }

      // Parse CSV (simple parser, assumes no commas in quoted fields)
      const parseCSVLine = (line) => {
        const result = []
        let current = ''
        let inQuotes = false
        
        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result.map(cell => cell.replace(/^"|"$/g, '').replace(/""/g, '"'))
      }

      const headers = parseCSVLine(lines[0])
      const dataLines = lines.slice(1)
      
      const results = {
        success: 0,
        failed: 0,
        errors: []
      }

      for (let i = 0; i < dataLines.length; i++) {
        progress.value = Math.round(((i + 1) / dataLines.length) * 100)
        
        try {
          const values = parseCSVLine(dataLines[i])
          const product = {
            name: values[1] || '',
            name_en: values[2] || null,
            description: values[3] || null,
            price: parseFloat(values[4]) || 0,
            original_price: values[5] ? parseFloat(values[5]) : null,
            image: values[6] || null,
            category_id: values[7] || null,
            stock: parseInt(values[8]) || 0,
            is_active: values[9]?.toUpperCase() === 'TRUE',
            is_flash_sale: values[10]?.toUpperCase() === 'TRUE'
          }

          // Validate required fields
          if (!product.name || !product.price) {
            throw new Error('ชื่อสินค้าและราคาเป็นข้อมูลที่จำเป็น')
          }

          // Check if updating existing product (has ID)
          const productId = values[0] ? parseInt(values[0]) : null
          
          if (productId) {
            // Update existing
            const { error: updateError } = await supabase
              .from('products')
              .update(product)
              .eq('id', productId)
            
            if (updateError) throw updateError
          } else {
            // Insert new
            const { error: insertError } = await supabase
              .from('products')
              .insert(product)
            
            if (insertError) throw insertError
          }

          results.success++
        } catch (err) {
          results.failed++
          results.errors.push(`แถว ${i + 2}: ${err.message}`)
        }
      }

      return { success: true, results }
    } catch (err) {
      console.error('Import error:', err)
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      importing.value = false
      progress.value = 0
    }
  }

  // Download CSV template
  const downloadTemplate = () => {
    const headers = [
      'ID', 'Name (TH)', 'Name (EN)', 'Description', 'Price', 'Original Price',
      'Image', 'Category ID', 'Stock', 'Is Active', 'Is Flash Sale'
    ]
    
    const example = [
      '', 'น้ำดื่ม', 'Drinking Water', 'น้ำดื่มบริสุทธิ์ 600ml', '10', '15',
      'https://example.com/image.jpg', 'drinks', '100', 'TRUE', 'FALSE'
    ]

    const csvContent = [
      headers.join(','),
      example.map(cell => `"${cell}"`).join(',')
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'products_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return {
    importing,
    exporting,
    progress,
    error,
    exportToCSV,
    importFromCSV,
    downloadTemplate
  }
}
