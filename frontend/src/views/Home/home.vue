<script setup lang="ts">
import top from '@/views/Home/components/top.vue'
import mycarousel from '@/views/Home/components/carousel.vue'
import category from '@/views/Home/components/category.vue'
import book from '@/views/Home/components/book.vue'

</script>

<template>
  <div class="home__container">
    <top></top>
    <div style="background: #fbf2f2">
      <div class="home__middle">
        <category style="margin-right: 8px"></category>
        <mycarousel style="margin-left: 24px"></mycarousel>
      </div>
    </div>
    <div class="home__end">
      <book></book>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home__container {
  width: 100%;
  margin: 0 auto;
  .home__middle {
    display: flex;
    width: 1200px;
    margin: 0 auto;
  }
  .home__end {
    width: 1200px;
    margin: 24px auto;
  }
}
</style>
