<template>
  <div>
    <button v-on:click="getMyList">Get Data</button>
    <div>
      C: {{ myDataList }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      myDataList: ['x']
    }
  },
  methods: {
    getMyList () {
      fetch('http://localhost:3000/users')
        .then(response => response.json())
        .then(data => (this.myDataList = data))
    }
  }
}
</script>
