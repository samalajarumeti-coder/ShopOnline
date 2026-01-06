# Project Structure

```
convenience-store/
├── src/
│   ├── components/     # Reusable Vue components
│   ├── views/          # Page-level components (routed)
│   ├── stores/         # Pinia stores (state management)
│   ├── lib/            # Utilities and service clients
│   ├── data/           # Static data files
│   ├── router/         # Vue Router configuration
│   ├── assets/         # Static assets (images, etc.)
│   ├── App.vue         # Root component
│   ├── main.js         # App entry point
│   └── style.css       # Global styles
├── supabase/
│   └── migrations/     # SQL migration files
├── scripts/            # Utility scripts (seeding, etc.)
└── public/             # Static public assets
```

## Naming Conventions

- Components: PascalCase (`ProductCard.vue`)
- Views: PascalCase with `View` suffix (`HomeView.vue`)
- Stores: camelCase with `use` prefix (`useCartStore`)
- Routes: kebab-case paths (`/categories`)

## Store Pattern

Each Pinia store uses Composition API style:

- `ref()` for reactive state
- `computed()` for derived state
- Async functions for Supabase operations
- Export all state and actions from setup function

## Component Pattern

- Use `<script setup>` for all components
- Props defined with `defineProps()`
- Emit events with `defineEmits()`
- Import stores directly where needed
