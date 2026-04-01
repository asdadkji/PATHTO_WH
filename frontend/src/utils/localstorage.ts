const storage = {
  get:(key:string):any => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (e) {
      console.log('读取本地存储失败：',e)
      return null
    }
  },
  set:(key:string,value:any) => {
    try {
      localStorage.setItem(key,JSON.stringify(value))
    } catch (e) {
      console.log('写入本地存储失败：',e)
    }
  },
  remove:(key:string) => {
    try {
      localStorage.removeItem(key)
    } catch (e) {
      console.log('删除本地存储失败：',e)
    }
  }
}
export default storage
