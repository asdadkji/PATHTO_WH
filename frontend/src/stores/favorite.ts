//收藏仓库
import {defineStore} from "pinia";
import {computed, reactive, ref, watch} from "vue";
import type{Favorite} from "@/types/store/favorite.ts";

// 本地存储键名
const FAVORITE_KEY = 'favorite:list'
const FAVORITED_IDS_KEY = 'favorite:ids'

// 读取本地存储
function read<T>(key: string, def: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : def
  } catch {
    return def
  }
}

// 写入本地存储
const write = (key: string, value: any) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const useFavoriteStore = defineStore('favorite', ()=>{
  const favoriteList = ref<Favorite[]>(read(FAVORITE_KEY, []))
  // 已收藏的ID数组（用于快速判断）
  const favoritedIds = ref<number[]>(read(FAVORITED_IDS_KEY, []))
  const deleteFavorite = (id:number)=>{
    favoriteList.value = favoriteList.value.filter(i=>i.id !== id)
    favoritedIds.value = favoritedIds.value.filter(item => item !== id)
  }
  //添加收藏
  const addFavoriteList = (data:Favorite) => {
    if (!favoritedIds.value.includes(data.id)) {
      favoriteList.value.push(data)
      favoritedIds.value.push(data.id)
    }
  }

  // 判断是否已收藏
  const isFavorited = (id: number): boolean => {
    return favoritedIds.value.includes(id)
  }

  // 切换收藏状态
  const toggleFavorite = (data: Favorite) => {
    if (isFavorited(data.id)) {
      deleteFavorite(data.id)
    } else {
      addFavoriteList(data)
    }
  }

  // 监听变化，自动持久化
  watch(
    favoriteList,
    (newList) => {
      write(FAVORITE_KEY, newList)
    },
    { deep: true }
  )
  watch(
    favoritedIds,
    (newIds) => {
      write(FAVORITED_IDS_KEY, newIds)
    },
    { deep: true }
  )

  return {
    favoriteList,
    favoritedIds,
    deleteFavorite,
    addFavoriteList,
    isFavorited,
    toggleFavorite
  }
})
