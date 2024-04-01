<script setup lang="ts">
import { io } from 'socket.io-client'

const socket = io('ws://localhost:3000')

console.log(socket)
</script>

<template>
  <RouterView />
</template>
