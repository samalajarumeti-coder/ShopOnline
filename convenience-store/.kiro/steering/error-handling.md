---
inclusion: always
---

# Error Handling Patterns

## Supabase Error Handling

```js
const fetchData = async () => {
  isLoading.value = true;
  error.value = null;

  try {
    const { data, error: supabaseError } = await supabase
      .from("table")
      .select("*");

    if (supabaseError) throw supabaseError;

    items.value = data;
  } catch (e) {
    error.value = e.message || "เกิดข้อผิดพลาด กรุณาลองใหม่";
    console.error("Fetch error:", e);
  } finally {
    isLoading.value = false;
  }
};
```

## User-Facing Error Messages (Thai)

| Error Type | Message                                          |
| ---------- | ------------------------------------------------ |
| Network    | `ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต` |
| Auth       | `อีเมลหรือรหัสผ่านไม่ถูกต้อง`                    |
| Not Found  | `ไม่พบข้อมูลที่ต้องการ`                          |
| Server     | `เกิดข้อผิดพลาด กรุณาลองใหม่ภายหลัง`             |
| Validation | `กรุณากรอกข้อมูลให้ครบถ้วน`                      |

## Loading States

ทุก async operation ต้องมี:

- `isLoading` state
- Loading indicator (spinner/skeleton)
- Disable buttons ขณะ loading

## Empty States

แสดง empty state ที่เป็นมิตรเมื่อไม่มีข้อมูล:

```vue
<div v-if="items.length === 0" class="text-center py-8 text-gray-500">
  <Icon name="inbox" class="w-12 h-12 mx-auto mb-2" />
  <p>ยังไม่มีรายการ</p>
</div>
```
