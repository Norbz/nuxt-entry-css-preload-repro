<script setup lang="ts">
const open = ref(false)
</script>

<template>
  <main>
    <button @click="open = true">Open</button>
    <!-- Lazy component: this page chunk loads it with a dynamic import. -->
    <LazyPanel v-if="open" />
  </main>
</template>
