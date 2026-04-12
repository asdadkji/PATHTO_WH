<script setup lang="ts">
import {ref, reactive} from "vue";
//传递筛选条件
const emit = defineEmits<{
  'update:level':[level:string],
  'update:author':[author:string],
}>()
//筛选条件-品相
const typeList = reactive([
  { name: '全新', id: 0, level: 'new' },
  { name: '九五品', id: 1, level: 'like_new'},
  { name: '九品', id: 2, level: 'very_good' },
  { name: '八品', id: 3, level: 'good' },
  { name: '七品', id: 4, level: 'acceptable' },
  { name: '六品', id: 5, level: 'poor'},
])
//筛选条件-作者
const authorList = reactive([
  {name: '张三', id: 0},
  {name: '王五', id: 1},
  {name: '赵六', id: 2},
  {name: '吴十', id: 3},
  {name: '鲁迅', id: 4},
  {name: '周九', id: 5},
])
//判定选中-品相
const selectedIndex = ref()
const handleSelect = (id:number) => {
  selectedIndex.value = id
  const item = typeList[id]
  if (!item) return
  emit('update:level', item.level)
}
//判定选择-作者
const selectedIndex_author = ref(0)
const isShowAuthor = ref(false)
const handleSelect_author = (id:number) => {
  isShowAuthor.value = true;
  selectedIndex_author.value = id
  const item = authorList[id]
  if (!item) return
  emit('update:author', item.name)
  /*if(id === selectedIndex_author.value) isShowAuthor.value = false*/
}
</script>

<template>
  <div class="leftfilter__container">
    <!--品相筛选-->
    <div class="leftfilter__item">
      <div class="leftfilter__header">
        <h3 class="leftfilter__title">品相</h3>
      </div>
      <ul class="leftfilter__list">
        <li 
          v-for="(type,idx) in typeList" 
          :key="idx" 
          :class="{active: idx === selectedIndex}" 
          @click="handleSelect(idx)"
          class="leftfilter__item"
        >
          {{type.name}}
        </li>
      </ul>
    </div>
    <!--作者筛选-->
    <div class="leftfilter__item">
      <div class="leftfilter__header">
        <h3 class="leftfilter__title">作者专栏</h3>
        <span class="leftfilter__reset" @click="$emit('update:author', '');isShowAuthor=false">重置</span>
      </div>
      <ul class="leftfilter__list">
        <li
          v-for="author in authorList"
          :key="author.id"
          :class="{active: author.id === selectedIndex_author && isShowAuthor}"
          @click="handleSelect_author(author.id)"
          class="leftfilter__item"
        >
          {{author.name}}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.leftfilter__container {
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  padding: 20px;
  width: 240px;
  transition: all 0.3s ease;
  &:hover {
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  }
  .leftfilter__item {
    margin-bottom: 24px;
    &:last-child {
      margin-bottom: 0;
    }
  }
  .leftfilter__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  .leftfilter__title {
    font-size: 16px;
    font-weight: 600;
    color: #333333;
    margin: 0;
  }
  .leftfilter__reset {
    font-size: 14px;
    color: #666666;
    cursor: pointer;
    transition: color 0.3s ease;
    &:hover {
      color: #ff4b60;
    }
  }
  .leftfilter__list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .leftfilter__item {
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-bottom: 8px;
    &:hover {
      background-color: #f8f9fa;
      color: #ff4b60;
    }
    &.active {
      background-color: #ffebee;
      color: #ff4b60;
      font-weight: 500;
    }
  }
}
</style>
