<script setup lang="ts">
//
const carouselData = [
  {
    url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=1528&q=80",
    alt: "图书阅读场景"
  },
  {
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    alt: "书架展示"
  },
  {
    url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?ixlib=rb-4.0.3&auto=format&fit=crop&w=1498&q=80",
    alt: "图书交易"
  },
  {
    url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80",
    alt: "图书收藏"
  }
]
</script>

<template>
  <!--轮播图-->
  <el-carousel indicator-position="outside" style="width: 980px; height: 300px;margin-top: 40px">
    <el-carousel-item v-for="img in carouselData" :key="img">
      <img :src="img.url" :alt="img.alt" />
    </el-carousel-item>
  </el-carousel>
</template>

<style scoped lang="scss">
.el-carousel__item h3 {
  display: flex;
  color: #475669;
  opacity: 0.75;
  line-height: 300px;
  margin: 0;
}

.el-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.el-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
