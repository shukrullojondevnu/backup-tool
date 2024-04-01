<script setup lang="ts">
import { ref, onMounted } from 'vue'
const connections = ref<{ name: string; host: string; port: string; path: string }[]>([])

onMounted(() => {
  getConnections()
})

async function getConnections() {
  const response = await fetch('http://localhost:3000/connections', {
    method: 'GET'
  })
  const data = await response.json()
  connections.value = data
}

async function selectFolder() {
  const response = await fetch('http://localhost:3000/selectFolder', {
    method: 'GET'
  })
  const data: { path: string } = await response.json()
  formData.value.path = data.path.slice(-1) === '\\' ? data.path : data.path + '\\'
}

async function createConnection() {
  const response = await fetch('http://localhost:3000/connection', {
    method: 'POST',
    body: JSON.stringify(formData.value)
  })
  await response.json()
}

const formData = ref({
  name: '',
  host: '',
  port: '',
  path: ''
})
</script>

<template>
  <main>
    <form class="flex flex-col" @submit.prevent="createConnection()">
      <input
        v-model="formData.name"
        type="text"
        placeholder="Name"
        class="input input-bordered w-full mb-3"
      />
      <div class="mb-3 flex">
        <input
          v-model="formData.host"
          type="text"
          placeholder="Host"
          class="input input-bordered w-full mr-3"
        />
        <input
          v-model="formData.port"
          type="text"
          placeholder="Port"
          class="input input-bordered w-full max-w-36"
        />
      </div>
      <div class="flex w-full mb-3">
        <input
          v-model="formData.path"
          type="text"
          placeholder="Path"
          class="input input-bordered w-full mr-3"
        />
        <button class="btn" type="button" @click="selectFolder()">Select</button>
      </div>
      <button class="btn" type="submit">Add</button>
    </form>

    <h1>connection</h1>
    <ul>
      <li v-for="(connection, index) in connections" :key="index">
        Name: <strong>{{ connection.name }}</strong> Host:<strong>{{ connection.host }}</strong>
        Port: <strong>{{ connection.port }}</strong>
      </li>
    </ul>
  </main>
</template>
