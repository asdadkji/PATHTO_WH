<script setup lang="ts">
import {onMounted, reactive, ref, watch} from "vue";
import {onClickOutside} from "@vueuse/core";
//引入路由
import router from "@/router";
import localstorage from "@/utils/localstorage.ts";
//搜索框输入值
const input = ref('')
//搜索框历史记录
let dynamicTags = reactive<string[]>([])
// 读取历史记录 - 保持响应式
const loadHistory = () => {
  try {
    const stored = localStorage.getItem('search_history')
    if (stored) {
      const history = JSON.parse(stored)
      dynamicTags.splice(0, dynamicTags.length, ...history)
    }
  } catch {
    dynamicTags.splice(0, dynamicTags.length)
  }
}
// 保存历史记录
const saveHistory = () => {
  localStorage.setItem('search_history', JSON.stringify([...dynamicTags]))
}
//删除标签
const handleClose = (tag: string) => {
  dynamicTags.splice(dynamicTags.indexOf(tag), 1)
}
//提交搜索
const submit = () => {
  if (input.value.length === 0) return;
  const keyword = input.value.trim()

  // 去重并添加到最新位置
  const existingIndex = dynamicTags.indexOf(keyword)
  if (existingIndex > -1) {
    // 如果已存在，先移除再添加到末尾（保持最新）
    dynamicTags.splice(existingIndex, 1)
  }

  dynamicTags.push(keyword);

  // 限制数量
  if (dynamicTags.length > 10) {
    dynamicTags.shift()
  }

  router.push({
    path: '/filter',
    query: {searchData: keyword}
  })
  input.value = ''
}
//历史记录搜索
const submit_history = (tag: number) => {
  router.push({
    path: '/filter',
    query: {searchData: dynamicTags[tag]}
  })
}
//全部删除
const isAllDeleted = ref(false)
const handleAllDelete = () => {
  isAllDeleted.value = false
  dynamicTags = []
  localstorage.remove('search_history')
}
//展示历史记录
const isShowHistory = ref(false)
const searchRoot = ref()
onClickOutside(searchRoot,()=>{isShowHistory.value=false})
//历史记录持久化
onMounted(() => {
  loadHistory()
})
// 监听变化自动保存
watch(() => [...dynamicTags], () => {
    saveHistory()
  }, { deep: true }
)
</script>

<template>
  <!--搜索框-->
  <div class="search__container" ref="searchRoot">
    <el-input
      placeholder="图书名称、作者、商家店名"
      v-model="input"
      clearable
      style="border: 1px solid #ccc; width: 600px; height: 40px; "
      @focus="isShowHistory = true"
    >
      <template #append>
        <el-button
          icon="Search"
          @click="submit"
          style="width: 80px"
        >
          搜索
        </el-button>
      </template>
    </el-input>
    <!--历史记录-->
    <div class="search__history" v-show="isShowHistory && dynamicTags.length" style="z-index: 999">
      <div class="history__title">
        <span>搜索记录</span>
        <span v-if="!isAllDeleted" @click="isAllDeleted = true">删除</span>
        <span v-else @click="handleAllDelete">全部删除</span>
      </div>
      <el-tag
        v-for="(tag,id) in dynamicTags"
        :key="id"
        closable
        @close="handleClose(tag)"
        :disable-transitions="false"
        style="margin-right: 8px; margin-top: 16px; cursor: pointer"
        @click="submit_history(id)"
      >
        {{tag}}
      </el-tag>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search__history {
  padding: 8px 16px;
  border: 1px solid #ccc;
  width: 600px;
  position: absolute;
  background: #edf0f3;
  .history__title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    span {
      &:nth-child(2):hover {
        cursor: pointer;
        color: crimson;
      }
    }
  }
}
</style>
<!--特点：引入@vueuse/core-->
