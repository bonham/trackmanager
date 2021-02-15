<template>
  <div>
    <button @click="getMyList">
      Get Data
    </button>
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
      fetch('/users')
        .then(response => response.json())
        .then(data => (this.myDataList = data))
    }
  }
}

</script>
