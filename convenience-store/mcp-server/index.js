#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const server = new Server(
  { name: 'convenience-store-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Tool definitions
const tools = [
  // ==================== PRODUCTS ====================
  {
    name: 'list_products',
    description: 'รายการสินค้าทั้งหมด พร้อม filter และ pagination',
    inputSchema: {
      type: 'object',
      properties: {
        category_id: { type: 'string', description: 'Filter by category ID' },
        is_flash_sale: { type: 'boolean', description: 'Filter flash sale items' },
        is_active: { type: 'boolean', description: 'Filter by active status' },
        search: { type: 'string', description: 'Search by name' },
        limit: { type: 'number', description: 'Limit results (default 50)' },
        offset: { type: 'number', description: 'Offset for pagination' },
        order_by: { type: 'string', description: 'Order by field (created_at, price, name)' },
        order_dir: { type: 'string', enum: ['asc', 'desc'], description: 'Order direction' }
      }
    }
  },
  {
    name: 'get_product',
    description: 'ดูรายละเอียดสินค้าตาม ID',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Product ID' } },
      required: ['id']
    }
  },
  {
    name: 'create_product',
    description: 'สร้างสินค้าใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ชื่อสินค้า (ไทย)' },
        name_en: { type: 'string', description: 'ชื่อสินค้า (อังกฤษ)' },
        price: { type: 'number', description: 'ราคา' },
        original_price: { type: 'number', description: 'ราคาเดิม (ถ้ามีส่วนลด)' },
        image: { type: 'string', description: 'URL รูปภาพ' },
        category_id: { type: 'string', description: 'Category ID' },
        is_flash_sale: { type: 'boolean', description: 'เป็น Flash Sale หรือไม่' },
        stock: { type: 'number', description: 'จำนวนสต็อก' },
        description: { type: 'string', description: 'รายละเอียดสินค้า' }
      },
      required: ['name', 'price', 'category_id']
    }
  },
  {
    name: 'update_product',
    description: 'อัพเดทข้อมูลสินค้า',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID' },
        name: { type: 'string' },
        name_en: { type: 'string' },
        price: { type: 'number' },
        original_price: { type: 'number' },
        image: { type: 'string' },
        category_id: { type: 'string' },
        is_flash_sale: { type: 'boolean' },
        is_active: { type: 'boolean' },
        stock: { type: 'number' },
        description: { type: 'string' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_product',
    description: 'ลบสินค้า (soft delete โดยตั้ง is_active = false)',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Product ID' } },
      required: ['id']
    }
  },
  {
    name: 'update_stock',
    description: 'อัพเดทสต็อกสินค้า',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Product ID' },
        stock: { type: 'number', description: 'จำนวนสต็อกใหม่' },
        adjustment: { type: 'number', description: 'ปรับเพิ่ม/ลด (ใช้แทน stock ได้)' }
      },
      required: ['id']
    }
  },
  {
    name: 'bulk_update_products',
    description: 'อัพเดทสินค้าหลายรายการพร้อมกัน',
    inputSchema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'number' }, description: 'Product IDs' },
        updates: {
          type: 'object',
          properties: {
            is_active: { type: 'boolean' },
            is_flash_sale: { type: 'boolean' },
            category_id: { type: 'string' }
          }
        }
      },
      required: ['ids', 'updates']
    }
  },

  // ==================== CATEGORIES ====================
  {
    name: 'list_categories',
    description: 'รายการหมวดหมู่ทั้งหมด',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'create_category',
    description: 'สร้างหมวดหมู่ใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Category ID (slug)' },
        name: { type: 'string', description: 'ชื่อหมวดหมู่ (ไทย)' },
        name_en: { type: 'string', description: 'ชื่อหมวดหมู่ (อังกฤษ)' },
        icon: { type: 'string', description: 'Icon name (Lucide)' },
        sort_order: { type: 'number', description: 'ลำดับการแสดง' }
      },
      required: ['id', 'name', 'name_en', 'icon']
    }
  },
  {
    name: 'update_category',
    description: 'อัพเดทหมวดหมู่',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Category ID' },
        name: { type: 'string' },
        name_en: { type: 'string' },
        icon: { type: 'string' },
        sort_order: { type: 'number' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_category',
    description: 'ลบหมวดหมู่ (ต้องไม่มีสินค้าในหมวดหมู่)',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Category ID' } },
      required: ['id']
    }
  },

  // ==================== ORDERS ====================
  {
    name: 'list_orders',
    description: 'รายการออเดอร์ทั้งหมด พร้อม filter',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'] },
        user_id: { type: 'string', description: 'Filter by user ID' },
        date_from: { type: 'string', description: 'Filter from date (ISO)' },
        date_to: { type: 'string', description: 'Filter to date (ISO)' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      }
    }
  },
  {
    name: 'get_order',
    description: 'ดูรายละเอียดออเดอร์พร้อมรายการสินค้า',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Order ID' } },
      required: ['id']
    }
  },
  {
    name: 'update_order_status',
    description: 'อัพเดทสถานะออเดอร์',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Order ID' },
        status: { type: 'string', enum: ['pending', 'confirmed', 'preparing', 'delivering', 'completed', 'cancelled'] }
      },
      required: ['id', 'status']
    }
  },
  {
    name: 'get_order_stats',
    description: 'สถิติออเดอร์ (จำนวน, ยอดขาย)',
    inputSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'From date (ISO)' },
        date_to: { type: 'string', description: 'To date (ISO)' }
      }
    }
  },

  // ==================== USERS ====================
  {
    name: 'list_users',
    description: 'รายการผู้ใช้ทั้งหมด',
    inputSchema: {
      type: 'object',
      properties: {
        role: { type: 'string', enum: ['user', 'admin', 'super_admin'] },
        search: { type: 'string', description: 'Search by name or email' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      }
    }
  },
  {
    name: 'get_user',
    description: 'ดูรายละเอียดผู้ใช้',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'User ID (UUID)' } },
      required: ['id']
    }
  },
  {
    name: 'update_user_points',
    description: 'อัพเดทแต้มผู้ใช้',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User ID' },
        points: { type: 'number', description: 'จำนวนแต้มใหม่' },
        adjustment: { type: 'number', description: 'ปรับเพิ่ม/ลด' }
      },
      required: ['id']
    }
  },
  {
    name: 'update_user_role',
    description: 'อัพเดท role ผู้ใช้',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'User ID' },
        role: { type: 'string', enum: ['user', 'admin', 'super_admin'] }
      },
      required: ['id', 'role']
    }
  },

  // ==================== COUPONS ====================
  {
    name: 'list_coupons',
    description: 'รายการคูปองทั้งหมด',
    inputSchema: {
      type: 'object',
      properties: {
        is_active: { type: 'boolean' },
        limit: { type: 'number' },
        offset: { type: 'number' }
      }
    }
  },
  {
    name: 'create_coupon',
    description: 'สร้างคูปองใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'รหัสคูปอง' },
        description: { type: 'string', description: 'รายละเอียด' },
        discount_type: { type: 'string', enum: ['percentage', 'fixed'], description: 'ประเภทส่วนลด' },
        discount_value: { type: 'number', description: 'มูลค่าส่วนลด' },
        min_order: { type: 'number', description: 'ยอดขั้นต่ำ' },
        max_discount: { type: 'number', description: 'ส่วนลดสูงสุด' },
        usage_limit: { type: 'number', description: 'จำกัดการใช้' },
        valid_from: { type: 'string', description: 'เริ่มใช้ได้ (ISO)' },
        valid_until: { type: 'string', description: 'หมดอายุ (ISO)' }
      },
      required: ['code', 'discount_type', 'discount_value']
    }
  },
  {
    name: 'update_coupon',
    description: 'อัพเดทคูปอง',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Coupon ID' },
        code: { type: 'string' },
        description: { type: 'string' },
        discount_type: { type: 'string', enum: ['percentage', 'fixed'] },
        discount_value: { type: 'number' },
        min_order: { type: 'number' },
        max_discount: { type: 'number' },
        usage_limit: { type: 'number' },
        valid_from: { type: 'string' },
        valid_until: { type: 'string' },
        is_active: { type: 'boolean' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_coupon',
    description: 'ลบคูปอง',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Coupon ID' } },
      required: ['id']
    }
  },

  // ==================== BANNERS ====================
  {
    name: 'list_banners',
    description: 'รายการแบนเนอร์ทั้งหมด',
    inputSchema: {
      type: 'object',
      properties: { is_active: { type: 'boolean' } }
    }
  },
  {
    name: 'create_banner',
    description: 'สร้างแบนเนอร์ใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'URL รูปภาพ' },
        title: { type: 'string', description: 'หัวข้อ' },
        subtitle: { type: 'string', description: 'หัวข้อรอง' },
        link: { type: 'string', description: 'ลิงก์เมื่อคลิก' },
        sort_order: { type: 'number', description: 'ลำดับการแสดง' }
      },
      required: ['image', 'title']
    }
  },
  {
    name: 'update_banner',
    description: 'อัพเดทแบนเนอร์',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Banner ID' },
        image: { type: 'string' },
        title: { type: 'string' },
        subtitle: { type: 'string' },
        link: { type: 'string' },
        sort_order: { type: 'number' },
        is_active: { type: 'boolean' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_banner',
    description: 'ลบแบนเนอร์',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'number', description: 'Banner ID' } },
      required: ['id']
    }
  },

  // ==================== ANALYTICS ====================
  {
    name: 'get_dashboard_stats',
    description: 'สถิติ Dashboard (ยอดขาย, ออเดอร์, ผู้ใช้)',
    inputSchema: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'From date (ISO)' },
        date_to: { type: 'string', description: 'To date (ISO)' }
      }
    }
  },
  {
    name: 'get_top_products',
    description: 'สินค้าขายดี',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'จำนวนสินค้า (default 10)' },
        date_from: { type: 'string' },
        date_to: { type: 'string' }
      }
    }
  },
  {
    name: 'get_sales_report',
    description: 'รายงานยอดขายรายวัน/เดือน',
    inputSchema: {
      type: 'object',
      properties: {
        group_by: { type: 'string', enum: ['day', 'week', 'month'], description: 'Group by period' },
        date_from: { type: 'string' },
        date_to: { type: 'string' }
      }
    }
  },
  {
    name: 'get_low_stock_products',
    description: 'สินค้าที่สต็อกต่ำ',
    inputSchema: {
      type: 'object',
      properties: {
        threshold: { type: 'number', description: 'Stock threshold (default 10)' }
      }
    }
  },

  // ==================== LOYALTY ====================
  {
    name: 'list_rewards',
    description: 'รายการรางวัลแลกแต้ม',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'create_reward',
    description: 'สร้างรางวัลใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ชื่อรางวัล' },
        description: { type: 'string' },
        points_required: { type: 'number', description: 'แต้มที่ต้องใช้' },
        image: { type: 'string' },
        stock: { type: 'number' },
        is_active: { type: 'boolean' }
      },
      required: ['name', 'points_required']
    }
  },
  {
    name: 'list_challenges',
    description: 'รายการ Challenge',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'create_challenge',
    description: 'สร้าง Challenge ใหม่',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        type: { type: 'string', enum: ['purchase_count', 'purchase_amount', 'category_purchase', 'streak'] },
        target_value: { type: 'number' },
        reward_points: { type: 'number' },
        start_date: { type: 'string' },
        end_date: { type: 'string' }
      },
      required: ['name', 'type', 'target_value', 'reward_points']
    }
  },

  // ==================== FLASH SALE ====================
  {
    name: 'list_flash_sale_products',
    description: 'รายการสินค้า Flash Sale ทั้งหมด',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'add_to_flash_sale',
    description: 'เพิ่มสินค้าเข้า Flash Sale',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: 'Product ID' },
        order: { type: 'number', description: 'ลำดับการแสดง' }
      },
      required: ['product_id']
    }
  },
  {
    name: 'remove_from_flash_sale',
    description: 'ลบสินค้าออกจาก Flash Sale',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: 'Product ID' }
      },
      required: ['product_id']
    }
  },
  {
    name: 'update_flash_sale_order',
    description: 'อัพเดทลำดับสินค้าใน Flash Sale',
    inputSchema: {
      type: 'object',
      properties: {
        product_id: { type: 'number', description: 'Product ID' },
        order: { type: 'number', description: 'ลำดับใหม่' }
      },
      required: ['product_id', 'order']
    }
  },
  {
    name: 'get_flash_sale_settings',
    description: 'ดูการตั้งค่า Flash Sale',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'update_flash_sale_settings',
    description: 'อัพเดทการตั้งค่า Flash Sale',
    inputSchema: {
      type: 'object',
      properties: {
        is_active: { type: 'boolean', description: 'เปิด/ปิด Flash Sale' },
        end_time: { type: 'string', description: 'เวลาสิ้นสุด (ISO datetime)' }
      }
    }
  },
  {
    name: 'clear_all_flash_sale',
    description: 'ล้างสินค้า Flash Sale ทั้งหมด',
    inputSchema: { type: 'object', properties: {} }
  },

  // ==================== SCHEDULED FLASH SALES ====================
  {
    name: 'list_scheduled_flash_sales',
    description: 'รายการ Flash Sale ที่ตั้งเวลาไว้',
    inputSchema: {
      type: 'object',
      properties: {
        is_active: { type: 'boolean', description: 'Filter by active status' }
      }
    }
  },
  {
    name: 'create_scheduled_flash_sale',
    description: 'สร้าง Flash Sale ตั้งเวลาล่วงหน้า',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ชื่อ Flash Sale' },
        start_time: { type: 'string', description: 'เวลาเริ่ม (ISO datetime)' },
        end_time: { type: 'string', description: 'เวลาสิ้นสุด (ISO datetime)' },
        product_ids: { type: 'array', items: { type: 'number' }, description: 'Product IDs' },
        notify_before: { type: 'number', description: 'แจ้งเตือนก่อนกี่นาที (default 60)' }
      },
      required: ['name', 'start_time', 'end_time']
    }
  },
  {
    name: 'update_scheduled_flash_sale',
    description: 'อัพเดท Flash Sale ที่ตั้งเวลาไว้',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Scheduled Flash Sale ID' },
        name: { type: 'string' },
        start_time: { type: 'string' },
        end_time: { type: 'string' },
        product_ids: { type: 'array', items: { type: 'number' } },
        notify_before: { type: 'number' },
        is_active: { type: 'boolean' }
      },
      required: ['id']
    }
  },
  {
    name: 'delete_scheduled_flash_sale',
    description: 'ลบ Flash Sale ที่ตั้งเวลาไว้',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Scheduled Flash Sale ID' }
      },
      required: ['id']
    }
  },

  // ==================== FLASH SALE TEMPLATES ====================
  {
    name: 'list_flash_sale_templates',
    description: 'รายการ Flash Sale Templates',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'create_flash_sale_template',
    description: 'สร้าง Flash Sale Template',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'ชื่อ Template' },
        description: { type: 'string', description: 'รายละเอียด' },
        product_ids: { type: 'array', items: { type: 'number' }, description: 'Product IDs' },
        default_duration: { type: 'number', description: 'ระยะเวลา (ชั่วโมง)' },
        default_notify_before: { type: 'number', description: 'แจ้งเตือนก่อน (นาที)' }
      },
      required: ['name']
    }
  },
  {
    name: 'use_flash_sale_template',
    description: 'ใช้ Template สร้าง Scheduled Flash Sale',
    inputSchema: {
      type: 'object',
      properties: {
        template_id: { type: 'number', description: 'Template ID' },
        start_time: { type: 'string', description: 'เวลาเริ่ม (ISO datetime) - ถ้าไม่ระบุจะเริ่มทันที' }
      },
      required: ['template_id']
    }
  },
  {
    name: 'delete_flash_sale_template',
    description: 'ลบ Flash Sale Template',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Template ID' }
      },
      required: ['id']
    }
  }
];


// Tool handlers
const handlers = {
  // ==================== PRODUCTS ====================
  async list_products({ category_id, is_flash_sale, is_active, search, limit = 50, offset = 0, order_by = 'created_at', order_dir = 'desc' }) {
    let query = supabase.from('products').select('*, categories(name, name_en)', { count: 'exact' });
    
    if (category_id) query = query.eq('category_id', category_id);
    if (is_flash_sale !== undefined) query = query.eq('is_flash_sale', is_flash_sale);
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    if (search) query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%`);
    
    query = query.order(order_by, { ascending: order_dir === 'asc' }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    if (error) throw error;
    return { products: data, total: count, limit, offset };
  },

  async get_product({ id }) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, name_en)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create_product(params) {
    const { data, error } = await supabase.from('products').insert(params).select().single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async update_product({ id, ...updates }) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async delete_product({ id }) {
    const { error } = await supabase.from('products').update({ is_active: false }).eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Product deactivated' };
  },

  async update_stock({ id, stock, adjustment }) {
    if (adjustment !== undefined) {
      const { data: current } = await supabase.from('products').select('stock').eq('id', id).single();
      stock = (current?.stock || 0) + adjustment;
    }
    const { data, error } = await supabase.from('products').update({ stock, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async bulk_update_products({ ids, updates }) {
    const { data, error } = await supabase.from('products').update({ ...updates, updated_at: new Date().toISOString() }).in('id', ids).select();
    if (error) throw error;
    return { success: true, updated: data.length, products: data };
  },

  // ==================== CATEGORIES ====================
  async list_categories() {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    return { categories: data };
  },

  async create_category(params) {
    const { data, error } = await supabase.from('categories').insert(params).select().single();
    if (error) throw error;
    return { success: true, category: data };
  },

  async update_category({ id, ...updates }) {
    const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, category: data };
  },

  async delete_category({ id }) {
    const { count } = await supabase.from('products').select('id', { count: 'exact' }).eq('category_id', id);
    if (count > 0) throw new Error(`Cannot delete: ${count} products in this category`);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Category deleted' };
  },

  // ==================== ORDERS ====================
  async list_orders({ status, user_id, date_from, date_to, limit = 50, offset = 0 }) {
    let query = supabase.from('orders').select('*, profiles(full_name, phone)', { count: 'exact' });
    
    if (status) query = query.eq('status', status);
    if (user_id) query = query.eq('user_id', user_id);
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    if (error) throw error;
    return { orders: data, total: count, limit, offset };
  },

  async get_order({ id }) {
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, profiles(full_name, phone, avatar_url), addresses(*)')
      .eq('id', id)
      .single();
    if (orderError) throw orderError;

    const { data: items, error: itemsError } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id);
    if (itemsError) throw itemsError;

    return { ...order, items };
  },

  async update_order_status({ id, status }) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, order: data };
  },

  async get_order_stats({ date_from, date_to }) {
    let query = supabase.from('orders').select('status, total, created_at');
    if (date_from) query = query.gte('created_at', date_from);
    if (date_to) query = query.lte('created_at', date_to);
    
    const { data, error } = await query;
    if (error) throw error;

    const stats = {
      total_orders: data.length,
      total_revenue: data.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + parseFloat(o.total), 0),
      by_status: {}
    };
    
    data.forEach(o => {
      stats.by_status[o.status] = (stats.by_status[o.status] || 0) + 1;
    });

    return stats;
  },


  // ==================== USERS ====================
  async list_users({ role, search, limit = 50, offset = 0 }) {
    let query = supabase.from('profiles').select('*, auth_users:id(email)', { count: 'exact' });
    
    if (role) query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,phone.ilike.%${search}%`);
    
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    if (error) throw error;
    return { users: data, total: count, limit, offset };
  },

  async get_user({ id }) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    if (profileError) throw profileError;

    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, total, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    return { ...profile, recent_orders: orders || [] };
  },

  async update_user_points({ id, points, adjustment }) {
    if (adjustment !== undefined) {
      const { data: current } = await supabase.from('profiles').select('points').eq('id', id).single();
      points = Math.max(0, (current?.points || 0) + adjustment);
    }
    const { data, error } = await supabase.from('profiles').update({ points, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, user: data };
  },

  async update_user_role({ id, role }) {
    const { data, error } = await supabase.from('profiles').update({ role, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, user: data };
  },

  // ==================== COUPONS ====================
  async list_coupons({ is_active, limit = 50, offset = 0 }) {
    let query = supabase.from('coupons').select('*', { count: 'exact' });
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    
    const { data, error, count } = await query;
    if (error) throw error;
    return { coupons: data, total: count };
  },

  async create_coupon(params) {
    const { data, error } = await supabase.from('coupons').insert({ ...params, is_active: true }).select().single();
    if (error) throw error;
    return { success: true, coupon: data };
  },

  async update_coupon({ id, ...updates }) {
    const { data, error } = await supabase.from('coupons').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, coupon: data };
  },

  async delete_coupon({ id }) {
    const { error } = await supabase.from('coupons').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Coupon deleted' };
  },

  // ==================== BANNERS ====================
  async list_banners({ is_active }) {
    let query = supabase.from('banners').select('*');
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    query = query.order('sort_order');
    
    const { data, error } = await query;
    if (error) throw error;
    return { banners: data };
  },

  async create_banner(params) {
    const { data, error } = await supabase.from('banners').insert({ ...params, is_active: true }).select().single();
    if (error) throw error;
    return { success: true, banner: data };
  },

  async update_banner({ id, ...updates }) {
    const { data, error } = await supabase.from('banners').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return { success: true, banner: data };
  },

  async delete_banner({ id }) {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Banner deleted' };
  },

  // ==================== ANALYTICS ====================
  async get_dashboard_stats({ date_from, date_to }) {
    const today = new Date().toISOString().split('T')[0];
    const defaultFrom = date_from || `${today}T00:00:00Z`;
    const defaultTo = date_to || `${today}T23:59:59Z`;

    // Orders stats
    const { data: orders } = await supabase
      .from('orders')
      .select('status, total')
      .gte('created_at', defaultFrom)
      .lte('created_at', defaultTo);

    // Users count
    const { count: totalUsers } = await supabase.from('profiles').select('id', { count: 'exact' });
    const { count: newUsers } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .gte('created_at', defaultFrom)
      .lte('created_at', defaultTo);

    // Products count
    const { count: totalProducts } = await supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true);
    const { count: lowStockProducts } = await supabase.from('products').select('id', { count: 'exact' }).eq('is_active', true).lt('stock', 10);

    const completedOrders = orders?.filter(o => o.status === 'completed') || [];
    
    return {
      orders: {
        total: orders?.length || 0,
        completed: completedOrders.length,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        revenue: completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0)
      },
      users: { total: totalUsers || 0, new: newUsers || 0 },
      products: { total: totalProducts || 0, low_stock: lowStockProducts || 0 }
    };
  },

  async get_top_products({ limit = 10, date_from, date_to }) {
    let query = supabase.from('order_items').select('product_id, product_name, quantity, subtotal');
    
    if (date_from || date_to) {
      const { data: orderIds } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', date_from || '1970-01-01')
        .lte('created_at', date_to || '2099-12-31')
        .eq('status', 'completed');
      
      if (orderIds?.length) {
        query = query.in('order_id', orderIds.map(o => o.id));
      }
    }

    const { data, error } = await query;
    if (error) throw error;

    const productStats = {};
    data?.forEach(item => {
      if (!productStats[item.product_id]) {
        productStats[item.product_id] = { product_id: item.product_id, product_name: item.product_name, quantity: 0, revenue: 0 };
      }
      productStats[item.product_id].quantity += item.quantity;
      productStats[item.product_id].revenue += parseFloat(item.subtotal);
    });

    return {
      products: Object.values(productStats)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit)
    };
  },

  async get_sales_report({ group_by = 'day', date_from, date_to }) {
    const { data, error } = await supabase
      .from('orders')
      .select('created_at, total, status')
      .gte('created_at', date_from || '1970-01-01')
      .lte('created_at', date_to || '2099-12-31')
      .eq('status', 'completed');
    
    if (error) throw error;

    const grouped = {};
    data?.forEach(order => {
      let key;
      const date = new Date(order.created_at);
      
      if (group_by === 'day') key = date.toISOString().split('T')[0];
      else if (group_by === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!grouped[key]) grouped[key] = { period: key, orders: 0, revenue: 0 };
      grouped[key].orders++;
      grouped[key].revenue += parseFloat(order.total);
    });

    return { report: Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period)) };
  },

  async get_low_stock_products({ threshold = 10 }) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, name_en, stock, category_id, categories(name)')
      .eq('is_active', true)
      .lt('stock', threshold)
      .order('stock');
    
    if (error) throw error;
    return { products: data, threshold };
  },


  // ==================== LOYALTY ====================
  async list_rewards() {
    const { data, error } = await supabase.from('rewards').select('*').order('points_required');
    if (error) throw error;
    return { rewards: data || [] };
  },

  async create_reward(params) {
    const { data, error } = await supabase.from('rewards').insert(params).select().single();
    if (error) throw error;
    return { success: true, reward: data };
  },

  async list_challenges() {
    const { data, error } = await supabase.from('challenges').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return { challenges: data || [] };
  },

  async create_challenge(params) {
    const { data, error } = await supabase.from('challenges').insert(params).select().single();
    if (error) throw error;
    return { success: true, challenge: data };
  },

  // ==================== FLASH SALE ====================
  async list_flash_sale_products() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('is_flash_sale', true)
      .eq('is_active', true)
      .order('flash_sale_order', { nullsFirst: false });
    if (error) throw error;
    return { products: data || [] };
  },

  async add_to_flash_sale({ product_id, order }) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_flash_sale: true, flash_sale_order: order || 999, updated_at: new Date().toISOString() })
      .eq('id', product_id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async remove_from_flash_sale({ product_id }) {
    const { data, error } = await supabase
      .from('products')
      .update({ is_flash_sale: false, flash_sale_order: null, updated_at: new Date().toISOString() })
      .eq('id', product_id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async update_flash_sale_order({ product_id, order }) {
    const { data, error } = await supabase
      .from('products')
      .update({ flash_sale_order: order, updated_at: new Date().toISOString() })
      .eq('id', product_id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, product: data };
  },

  async get_flash_sale_settings() {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('key', 'flash_sale')
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return { settings: data?.value || { is_active: true, end_time: null } };
  },

  async update_flash_sale_settings({ is_active, end_time }) {
    const { data, error } = await supabase
      .from('app_settings')
      .upsert({
        key: 'flash_sale',
        value: { is_active, end_time },
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    if (error) throw error;
    return { success: true, settings: data.value };
  },

  async clear_all_flash_sale() {
    const { data, error } = await supabase
      .from('products')
      .update({ is_flash_sale: false, flash_sale_order: null, updated_at: new Date().toISOString() })
      .eq('is_flash_sale', true)
      .select();
    if (error) throw error;
    return { success: true, cleared: data?.length || 0 };
  },

  // ==================== SCHEDULED FLASH SALES ====================
  async list_scheduled_flash_sales({ is_active }) {
    let query = supabase.from('scheduled_flash_sales').select('*').order('start_time');
    if (is_active !== undefined) query = query.eq('is_active', is_active);
    
    const { data, error } = await query;
    if (error) throw error;
    return { scheduled_sales: data || [] };
  },

  async create_scheduled_flash_sale({ name, start_time, end_time, product_ids = [], notify_before = 60 }) {
    const { data, error } = await supabase
      .from('scheduled_flash_sales')
      .insert({ name, start_time, end_time, product_ids, notify_before, is_active: true })
      .select()
      .single();
    if (error) throw error;
    return { success: true, scheduled_sale: data };
  },

  async update_scheduled_flash_sale({ id, ...updates }) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('scheduled_flash_sales')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { success: true, scheduled_sale: data };
  },

  async delete_scheduled_flash_sale({ id }) {
    const { error } = await supabase.from('scheduled_flash_sales').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Scheduled flash sale deleted' };
  },

  // ==================== FLASH SALE TEMPLATES ====================
  async list_flash_sale_templates() {
    const { data, error } = await supabase.from('flash_sale_templates').select('*').eq('is_active', true).order('use_count', { ascending: false });
    if (error) throw error;
    return { templates: data || [] };
  },

  async create_flash_sale_template({ name, description, product_ids = [], default_duration = 24, default_notify_before = 60 }) {
    const { data, error } = await supabase
      .from('flash_sale_templates')
      .insert({ name, description, product_ids, default_duration, default_notify_before, is_active: true })
      .select()
      .single();
    if (error) throw error;
    return { success: true, template: data };
  },

  async use_flash_sale_template({ template_id, start_time }) {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('flash_sale_templates')
      .select('*')
      .eq('id', template_id)
      .single();
    if (templateError) throw templateError;

    // Calculate times
    const startDate = start_time ? new Date(start_time) : new Date();
    const endDate = new Date(startDate.getTime() + template.default_duration * 60 * 60 * 1000);

    // Create scheduled sale
    const { data: sale, error: saleError } = await supabase
      .from('scheduled_flash_sales')
      .insert({
        name: template.name,
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        product_ids: template.product_ids,
        notify_before: template.default_notify_before,
        is_active: true,
      })
      .select()
      .single();
    if (saleError) throw saleError;

    // Update use count
    await supabase.from('flash_sale_templates').update({ use_count: (template.use_count || 0) + 1 }).eq('id', template_id);

    return { success: true, scheduled_sale: sale };
  },

  async delete_flash_sale_template({ id }) {
    const { error } = await supabase.from('flash_sale_templates').delete().eq('id', id);
    if (error) throw error;
    return { success: true, message: 'Template deleted' };
  }
};

// Register tool list handler
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

// Register tool call handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    const handler = handlers[name];
    if (!handler) {
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
    }

    const result = await handler(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Convenience Store MCP Server running');
}

main().catch(console.error);
