<template>
  <div>

    <nav class="navbar navbar-expand-sm bg-body-tertiary shadow-sm py-3">
      <div class="container-fluid">
        <a class="navbar-brand" href="#">Trackmanager</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNavDropdown">
          <ul class="navbar-nav">
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Filter
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Year</a></li>
                <li><a class="dropdown-item" href="#">Text</a></li>
                <li><a class="dropdown-item" href="#">Area</a></li>
              </ul>
            </li>
            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                List
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Sections</a></li>
                <li><a class="dropdown-item" href="#">Flat</a></li>
              </ul>
            </li>

            <li class="nav-item dropdown">
              <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                Maintain
              </a>
              <ul class="dropdown-menu">
                <li><a class="dropdown-item" href="#">Edit</a></li>
                <li><a class="dropdown-item" href="#">Upload</a></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>

  </div>
</template>