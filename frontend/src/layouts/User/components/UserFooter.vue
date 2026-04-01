<script setup lang="ts">
import {reactive} from "vue";
//页脚参数
const topics = reactive(
  [
    "热搜专题", "上门收书", "活着" ,"百年孤独", "三体", "被讨厌的勇气",
    "花田半亩", "坏小孩", "你当像鸟飞往你的山", "国富论", "当你老了",
    "社会心理学", "金融学", "概率论与数理统计", "伤寒论", "暂坐", "文城",
    "巴黎记", "在路上", "阿来", "卫斯理", "林徽因", "罗曼罗兰", "萧鼎",
    "梁羽生", "席慕蓉", "许地山", "萧红", "托马斯·曼", "路遥"]
)
</script>

<template>
  <footer class="footer">
    <div class="footer__container">
      <span class="footer__title">友情推荐专题</span>
      <div class="footer__topics">
        <span v-for="topic in topics" :key="topic" class="footer__item">{{ topic }}</span>
      </div>
    </div>
  </footer>
</template>

<style scoped lang="scss">
//页脚容器
.footer {
  width: 1200px;
  margin: 0 auto;
}
//页脚区
.footer__container {
  display: flex;
  flex-direction: column;
  //页脚标题
  .footer__title {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    font-size: 20px;
    font-weight: bold;
  }
  //页脚内容区
  .footer__topics {
    display: flex;
    flex-wrap: wrap;
    padding: 8px;
    border: 1px solid #ccc;
    //页脚内容
    .footer__item {
      margin-right: 8px;
    }
  }
}
</style>
<!--目前已完工-->
