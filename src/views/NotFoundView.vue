<template>
  <div class="not-found">
    <v-card class="not-found-card" elevation="2">
      <v-card-item class="text-center">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h1 class="text-h4 mb-2">404 - Page Not Found</h1>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <v-btn color="primary" size="large" to="/dashboard">
          <v-icon start>mdi-home</v-icon>
          Return to Dashboard
        </v-btn>
      </v-card-item>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// No additional logic needed for this view
</script>

<style scoped>
.not-found {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  padding: 16px;
}

.not-found-card {
  max-width: 500px;
  width: 100%;
  padding: 24px;
}
</style>
