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
    <div class="leftfilter__item" style="margin-bottom: 8px;border-bottom: 1px solid #e0e0e0;padding-bottom: 8px">
      <span class="leftfilter__title">品相</span>
      <ul class="leftfilter__type">
        <li v-for="(type,idx) in typeList" :key="idx" :class="{active: idx === selectedIndex}" @click="handleSelect(idx)">
          {{type.name}}
        </li>
      </ul>
    </div>
    <!--作者筛选-->
    <div class="leftfilter__item">
      <span class="leftfilter__title">作者专栏<span style="margin-left: 24px;color:red;cursor: pointer" @click="$emit('update:author', '');isShowAuthor=false">重置</span></span>
      <ul class="leftfilter__type">
        <li
          v-for="author in authorList"
          :key="author.id"
          :class="{active: author.id === selectedIndex_author && isShowAuthor}"
          @click="handleSelect_author(author.id)"
        >
          {{author.name}}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="scss">
.leftfilter__container {
  padding: 8px 4px;
  background-color: #f1f1f1;
  display: flex;
  flex-direction: column;
  max-width: 200px;
  width: 160px;
  .leftfilter__item {
    display: flex;
    flex-direction: column;
    .leftfilter__title {
      font-size: 14px;
      font-weight: bold;
    }
    .leftfilter__type {
      li {
        margin-left: 8px;
        &:hover {
          color: #ff6700;
          cursor: pointer;
        }
      }
    }
  }
}
.active {
  color: #ff6700;
}
</style>
