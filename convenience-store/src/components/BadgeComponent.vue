<script setup>
import { computed } from "vue";

const props = defineProps({
  variant: {
    type: String,
    default: "default",
    validator: (value) =>
      ["default", "success", "warning", "error", "info", "primary"].includes(
        value
      ),
  },
  size: {
    type: String,
    default: "md",
    validator: (value) => ["sm", "md", "lg"].includes(value),
  },
  rounded: {
    type: Boolean,
    default: false,
  },
  outline: {
    type: Boolean,
    default: false,
  },
});

const variantClasses = computed(() => {
  if (props.outline) {
    const outlineVariants = {
      default: "border-gray-300 text-gray-700 bg-white",
      success: "border-green-500 text-green-700 bg-white",
      warning: "border-yellow-500 text-yellow-700 bg-white",
      error: "border-red-500 text-red-700 bg-white",
      info: "border-blue-500 text-blue-700 bg-white",
      primary: "border-[#007f3e] text-[#007f3e] bg-white",
    };
    return outlineVariants[props.variant] || outlineVariants.default;
  }

  const variants = {
    default: "bg-gray-100 text-gray-700",
    success: "bg-green-100 text-green-700",
    warning: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
    info: "bg-blue-100 text-blue-700",
    primary: "bg-green-100 text-[#007f3e]",
  };
  return variants[props.variant] || variants.default;
});

const sizeClasses = computed(() => {
  const sizes = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };
  return sizes[props.size] || sizes.md;
});

const roundedClass = computed(() => {
  return props.rounded ? "rounded-full" : "rounded";
});

const borderClass = computed(() => {
  return props.outline ? "border" : "";
});
</script>

<template>
  <span
    class="inline-flex items-center gap-1 font-medium whitespace-nowrap"
    :class="[variantClasses, sizeClasses, roundedClass, borderClass]"
  >
    <slot></slot>
  </span>
</template>
