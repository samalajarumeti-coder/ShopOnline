<script setup>
import { ref, watch } from "vue";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Type,
} from "lucide-vue-next";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "เริ่มพิมพ์...",
  },
});

const emit = defineEmits(["update:modelValue"]);

const editor = ref(null);
const content = ref(props.modelValue);

watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== content.value) {
      content.value = newVal;
      if (editor.value) {
        editor.value.innerHTML = newVal;
      }
    }
  }
);

const execCommand = (command, value = null) => {
  document.execCommand(command, false, value);
  updateContent();
};

const updateContent = () => {
  if (editor.value) {
    content.value = editor.value.innerHTML;
    emit("update:modelValue", content.value);
  }
};

const onInput = () => {
  updateContent();
};

const onPaste = (e) => {
  e.preventDefault();
  const text = e.clipboardData.getData("text/plain");
  document.execCommand("insertText", false, text);
};
</script>

<template>
  <div class="border rounded-lg overflow-hidden bg-white">
    <!-- Toolbar -->
    <div class="flex items-center gap-1 p-2 border-b bg-gray-50">
      <button
        type="button"
        @click="execCommand('bold')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="ตัวหนา"
      >
        <Bold class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="execCommand('italic')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="ตัวเอียง"
      >
        <Italic class="w-4 h-4" />
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      <button
        type="button"
        @click="execCommand('insertUnorderedList')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="รายการแบบจุด"
      >
        <List class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="execCommand('insertOrderedList')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="รายการแบบตัวเลข"
      >
        <ListOrdered class="w-4 h-4" />
      </button>
      <div class="w-px h-6 bg-gray-300 mx-1"></div>
      <select
        @change="
          (e) => {
            execCommand('formatBlock', e.target.value);
            e.target.value = '';
          }
        "
        class="text-sm border-0 bg-transparent focus:ring-0 cursor-pointer"
      >
        <option value="">ปกติ</option>
        <option value="h3">หัวข้อใหญ่</option>
        <option value="h4">หัวข้อกลาง</option>
        <option value="h5">หัวข้อเล็ก</option>
      </select>
      <div class="flex-1"></div>
      <button
        type="button"
        @click="execCommand('undo')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="ย้อนกลับ"
      >
        <Undo class="w-4 h-4" />
      </button>
      <button
        type="button"
        @click="execCommand('redo')"
        class="p-2 hover:bg-gray-200 rounded transition-colors"
        title="ทำซ้ำ"
      >
        <Redo class="w-4 h-4" />
      </button>
    </div>

    <!-- Editor -->
    <div
      ref="editor"
      contenteditable="true"
      @input="onInput"
      @paste="onPaste"
      :data-placeholder="placeholder"
      class="min-h-[150px] max-h-[300px] overflow-y-auto p-3 text-sm focus:outline-none prose prose-sm max-w-none"
      v-html="content"
    ></div>
  </div>
</template>

<style scoped>
[contenteditable]:empty:before {
  content: attr(data-placeholder);
  color: #9ca3af;
}

[contenteditable] {
  outline: none;
}

[contenteditable]:focus {
  outline: none;
}

/* Prose styles for rich text */
:deep(h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(h4) {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(h5) {
  font-size: 1rem;
  font-weight: 600;
  margin: 0.5rem 0;
}

:deep(ul),
:deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

:deep(li) {
  margin: 0.25rem 0;
}

:deep(strong) {
  font-weight: 600;
}

:deep(em) {
  font-style: italic;
}
</style>
