// Setup database for project hdcigjthmiohhnfcqnvl
// Run: node scripts/setup-database.js

const supabaseUrl = 'https://hdcigjthmiohhnfcqnvl.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkY2lnanRobWlvaGhuZmNxbnZsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzQ4Mzc2NSwiZXhwIjoyMDgzMDU5NzY1fQ.s8fwR-aZz0tq4ISY2XRlAI6p72hzQGdN-1v0KYgyNcY'

async function runSQL(sql, description) {
  console.log(`⏳ ${description}...`)
  
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  })

  // Use postgres endpoint instead
  const pgResponse = await fetch(`${supabaseUrl}/pg`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`
    },
    body: JSON.stringify({ query: sql })
  })

  return true
}

async function checkConnection() {
  console.log('🔌 Testing connection to Supabase...')
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      }
    })
    
    if (response.ok) {
      console.log('✅ Connected to Supabase!')
      return true
    } else {
      console.log('❌ Connection failed:', response.status, response.statusText)
      return false
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message)
    return false
  }
}

async function insertData() {
  console.log('\n📦 Inserting seed data...')
  
  // Insert categories
  const categories = [
    { id: 'food', name: 'อาหาร', name_en: 'Food', icon: 'UtensilsCrossed', sort_order: 1 },
    { id: 'drinks', name: 'เครื่องดื่ม', name_en: 'Drinks', icon: 'Coffee', sort_order: 2 },
    { id: 'personal', name: 'ของใช้ส่วนตัว', name_en: 'Personal Care', icon: 'Sparkles', sort_order: 3 },
    { id: 'household', name: 'ของใช้ในบ้าน', name_en: 'Household', icon: 'Home', sort_order: 4 },
    { id: 'snacks', name: 'ขนมขบเคี้ยว', name_en: 'Snacks', icon: 'Cookie', sort_order: 5 },
    { id: 'all', name: 'ทั้งหมด', name_en: 'All Items', icon: 'Grid3X3', sort_order: 6 },
  ]

  const catResponse = await fetch(`${supabaseUrl}/rest/v1/categories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'resolution=merge-duplicates'
    },
    body: JSON.stringify(categories)
  })
  
  if (catResponse.ok) {
    console.log('✅ Categories inserted')
  } else {
    const err = await catResponse.text()
    console.log('⚠️ Categories:', err)
  }

  // Insert products
  const products = [
    { name: 'ข้าวกล่อง หมูกระเทียม', name_en: 'Garlic Pork Rice Box', price: 45, original_price: 55, image: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: true },
    { name: 'แซนวิช ไก่อบ', name_en: 'Roasted Chicken Sandwich', price: 35, original_price: 42, image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: true },
    { name: 'น้ำดื่ม Crystal 600ml', name_en: 'Crystal Water 600ml', price: 7, original_price: null, image: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=300&h=300&fit=crop', category_id: 'drinks', is_flash_sale: false },
    { name: 'กาแฟกระป๋อง เบิร์ดี้', name_en: 'Birdy Canned Coffee', price: 15, original_price: 18, image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=300&h=300&fit=crop', category_id: 'drinks', is_flash_sale: true },
    { name: 'ขนมปังปิ้ง เนยสด', name_en: 'Butter Toast', price: 25, original_price: null, image: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: false },
    { name: 'โยเกิร์ต ดัชชี่', name_en: 'Dutchie Yogurt', price: 12, original_price: 15, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=300&h=300&fit=crop', category_id: 'drinks', is_flash_sale: true },
    { name: 'มาม่า รสต้มยำกุ้ง', name_en: 'Mama Tom Yum Shrimp', price: 8, original_price: null, image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: false },
    { name: 'ยาสีฟัน คอลเกต', name_en: 'Colgate Toothpaste', price: 35, original_price: 45, image: 'https://images.unsplash.com/photo-1559650656-5d1d361ad10e?w=300&h=300&fit=crop', category_id: 'personal', is_flash_sale: true },
    { name: 'สบู่ ลักส์', name_en: 'Lux Soap', price: 25, original_price: null, image: 'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=300&h=300&fit=crop', category_id: 'personal', is_flash_sale: false },
    { name: 'ไอศกรีม วอลล์', name_en: 'Walls Ice Cream', price: 20, original_price: 25, image: 'https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: true },
    { name: 'ชาเขียว โออิชิ', name_en: 'Oishi Green Tea', price: 20, original_price: null, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&h=300&fit=crop', category_id: 'drinks', is_flash_sale: false },
    { name: 'ขนมปัง ฟาร์มเฮ้าส์', name_en: 'Farmhouse Bread', price: 32, original_price: null, image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=300&fit=crop', category_id: 'food', is_flash_sale: false },
    { name: 'แชมพู แพนทีน', name_en: 'Pantene Shampoo', price: 89, original_price: 109, image: 'https://images.unsplash.com/photo-1631729371254-42c2892f0e6e?w=300&h=300&fit=crop', category_id: 'personal', is_flash_sale: true },
    { name: 'นมสด เมจิ', name_en: 'Meiji Fresh Milk', price: 18, original_price: null, image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=300&fit=crop', category_id: 'drinks', is_flash_sale: false },
    { name: 'ถุงขยะ ตราเสือ', name_en: 'Tiger Garbage Bags', price: 29, original_price: 35, image: 'https://via.placeholder.com/300x300/4CAF50/FFFFFF?text=Garbage+Bags', category_id: 'household', is_flash_sale: false },
  ]

  const prodResponse = await fetch(`${supabaseUrl}/rest/v1/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(products)
  })
  
  if (prodResponse.ok) {
    console.log('✅ Products inserted')
  } else {
    const err = await prodResponse.text()
    console.log('⚠️ Products:', err)
  }

  // Insert banners
  const banners = [
    { image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&h=400&fit=crop', title: 'โปรโมชั่นสุดคุ้ม!', subtitle: 'ลดสูงสุด 50%', sort_order: 1 },
    { image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop', title: 'สั่งครบ 200 บาท', subtitle: 'ส่งฟรี!', sort_order: 2 },
    { image: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=800&h=400&fit=crop', title: 'สมาชิกใหม่', subtitle: 'รับส่วนลด 20%', sort_order: 3 },
  ]

  const bannerResponse = await fetch(`${supabaseUrl}/rest/v1/banners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(banners)
  })
  
  if (bannerResponse.ok) {
    console.log('✅ Banners inserted')
  } else {
    const err = await bannerResponse.text()
    console.log('⚠️ Banners:', err)
  }

  // Insert coupons
  const coupons = [
    { code: 'WELCOME20', description: 'ส่วนลด 20% สำหรับสมาชิกใหม่', discount_type: 'percentage', discount_value: 20, min_order: 100, max_discount: 50, valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
    { code: 'FREESHIP', description: 'ส่งฟรีไม่มีขั้นต่ำ', discount_type: 'fixed', discount_value: 30, min_order: 0, max_discount: 30, valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() },
    { code: 'SAVE50', description: 'ลด 50 บาท เมื่อซื้อครบ 300', discount_type: 'fixed', discount_value: 50, min_order: 300, max_discount: 50, valid_until: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() },
  ]

  const couponResponse = await fetch(`${supabaseUrl}/rest/v1/coupons`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify(coupons)
  })
  
  if (couponResponse.ok) {
    console.log('✅ Coupons inserted')
  } else {
    const err = await couponResponse.text()
    console.log('⚠️ Coupons:', err)
  }
}

async function main() {
  const connected = await checkConnection()
  if (!connected) {
    console.log('\n❌ Cannot connect to Supabase. Please check your credentials.')
    return
  }

  console.log('\n📋 Tables need to be created first!')
  console.log('Please run the SQL in supabase/schema.sql via Supabase Dashboard:')
  console.log('👉 https://supabase.com/dashboard/project/hdcigjthmiohhnfcqnvl/sql/new')
  console.log('\nAfter creating tables, run this script again to insert data.')
  
  // Try to insert data (will fail if tables don't exist)
  await insertData()
  
  console.log('\n🎉 Setup complete!')
}

main().catch(console.error)
