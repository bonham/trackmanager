<template>
  <div id="app">
    <b-navbar
      class="shadow-sm bg-white border-bottom"
    >
      <b-navbar-nav class="my-2 my-md-0 mr-md-3">
        <b-nav-item
          to="/"
          class="p-2 text-dark"
        >
          Home
        </b-nav-item>
        <b-nav-item
          to="/testpage1"
          class="p-2 text-dark"
        >
          Testpage1
        </b-nav-item>
        <b-nav-item
          to="/about"
          class="p-2 text-dark"
        >
          About
        </b-nav-item>
      </b-navbar-nav>
    </b-navbar>
    <b-container>
      <router-view />
    </b-container>
  </div>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
