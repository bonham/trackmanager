/* eslint-disable vue/valid-v-for */
<template>
  <div>
    <div
      v-for="item in myDataList"
      :key="item.id"
    >
      {{ item.src }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld2',
  data () {
    return {
      myDataList: ['x']
    }
  },

  created: function () {
    fetch('/api/tracks')
      .then(response => response.json())
      .then(data => { this.myDataList = data })
  }
}

</script>
