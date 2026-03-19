<template>
  <div class="min-h-screen bg-gray-900 flex flex-col overflow-x-hidden">
    <AppNav />
    <main class="flex-1 flex flex-col items-center justify-center p-0 lg:p-4">
      <slot />
    </main>
  </div>
</template>
