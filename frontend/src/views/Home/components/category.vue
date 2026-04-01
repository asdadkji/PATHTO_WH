<script setup lang="ts">
import {computed, ref} from "vue";
import router from "@/router";
//具体分类
//小说
const NovelTags = [
  "中国古典小说", "中国现代小说(1919年-1949年)", "中国当代小说(1949年以后)" ,
  "四大名著" , "世界名著" , "外国小说" , "侦探/悬疑/推理" , "科幻" , "情感/家庭/婚姻" ,
  "穿越/重生" , "武侠" , "惊悚/恐怖" , "魔幻/奇幻/玄幻" , "青春/影视" , "历史" ,
  "官场" , "职场" , "社会" , "军事" , "财经" , "作品集"
] as const
//文学
const LiteratureTags = [
  "名家作品" , "世界文学" , "中国古代文学(1840年以前)" , "中国近代文学(1840年-1919年)" ,
  "中国现代文学(1919年-1949年)" , "中国当代文学(1949年至今)" , "诗歌词曲" , "散文/随笔/书信" ,
  "戏剧与曲艺" , "纪实文学" , "民间文学" , "文学评论与鉴赏" , "文学理论" , "青春文学"
] as const
//语言文字
const LanguagesTags = [
  "语言学" , "汉语" , "中国少数民族语言" , "英语" , "日语" , "韩语" , "俄语" , "德语" ,
  "法语" , "西班牙语" , "阿拉伯语" , "汉藏语系" , "阿尔泰语系" , "印欧语系"
] as const
//历史
const HistoryTags = [
  "中国史", "世界史", "地方史志", "普及读物", "历史研究与评论", "史家名著", "文物考古", "人物传记"
] as const
//地理
const GeographicTags = [
  "中国地理", "世界地理", "风俗习惯", "名胜古迹", "地图", "历史地理和艺术理论"
] as const
//艺术
const ArtTags = [
  "绘画", "书法/篆刻", "雕塑", "摄影", "音乐", "舞蹈", "设计", "建筑艺术", "工艺美术",
  "影视/媒体艺术/戏剧艺术/舞台艺术", "动漫/幽默", "鉴赏收藏"
] as const
//哲学
const PoliticsTags = [
  "政治理论", "中国政治", "世界政治", "外交、国际关系"
] as const
//法律
const LawTags = [
  "法律理论", "国际法", "中国法律", "国家法/宪法", "行政法", "经济法、财政法", "民法", "刑法", "诉讼法/程序法", "司法制度", "商法"
] as const
//军事
const MilitaryTags = [
  "军事理论", "中国军事", "世界军事", "军事史", "古代兵法/战法", "经典军事著作", "武器装备"
] as const
//哲学/心理
const PhilosophyTags = [
  "哲学理论", "世界哲学", "中国哲学", "思维科学", "逻辑学(论理学)", "伦理学(道德哲学)", "美学", "心理学", "励志与成功"
] as const
//宗教
const ReligionTags = [
  "宗教理论概况分析", "神话与原始宗教", "佛教", "道教", "伊斯兰教(回教)", "基督教", "其他宗教", "术数", "阴阳五行",
  "占卜", "命相", "堪舆(风水)", "巫医巫术"
] as const
//经济
const EconomicTags = [
  "经济学理论", "中国经济", "世界经济", "行业经济", "会计/审计", "财政税收", "金融", "保险", "贸易", "投资理财",
  "市场营销", "经济管理", "证券/股票", "金融银行与货币"
] as const
//社科
const SocialScienceTags = [
  "社会学","文化","新闻出版","图书馆学","档案学","文化人类学/人口学"
] as const
//综合
const ComprehensiveTags = [
  "字典辞典","工具书","百科全书/年鉴"
] as const
//童书
const ChildrenTags = [
  "幼儿启蒙","儿童文学","儿童绘本","科普百科","少儿英语","动漫卡通","音乐舞蹈","绘画书法","儿童手工","智力游戏","婴儿读物","玩具书"
] as const
//生说
const LifeTags = [
  "孕产/胎教","亲子/家教","旅游/地图","烹饪/美食","茶酒饮品","时尚/美妆","家庭/家居","婚恋/两性","娱乐/休闲","健身/保健"
] as const
//体育
const SportsTags = [
  "体育理论","奥林匹克","田径/体操","球类运动","武术及民族形式体育","水上、冰上与雪上运动","其他体育运动","棋牌","文体活动"
] as const
//工程技术
const EngineeringTags = [
  "工业技术","矿业工程","金属学与金属工艺","机械、仪表工业","能源与动力工程","原子能技术","电工技术","电子与通信","化学工业",
  "轻工业、手工业","建筑","水利工程","汽车与交通运输","航空/航天"
] as const
//互联网
const InternetTags = [
  "计算机理论","编程与开发","操作系统","大数据与云计算","图形图像/多媒体","网站设计与网页开发","网络与通讯","硬件、嵌入式开发",
  "办公软件","信息安全","辅助设计与工程计算","软件工程/开发项目管理"
] as const
//自然科学
const NaturalScienceTags = [
  "农业/林业","畜牧/养殖","生物科学","环境科学","数学","物理学","力学","化学","天文学","测绘学","地球科学",
  "大气科学(气象学)","地质学","海洋学","自然地理学"
] as const
//医药卫生
const MedicineTags = [
  "医学理论","预防医学","中医","基础医学","临床医学","药学","护理学","医院管理","医疗器械","内科学","外科学","妇产科学","儿科学",
  "肿瘤学","神经病学与精神病学","皮肤病学与性病学","耳鼻咽喉科学","眼科学","口腔科学"
] as const
//教材
const TextbookTags = [
  "大学教材","研究生教材","高职高专教材","中职中专教材","成人教育","职业技术培训","公共课","经济管理类","工学类","文法类",
  "医学类","理学类","计算机"
] as const
//教辅
const TeachingAidsTags = [
  "一年级","二年级","三年级","四年级","五年级","六年级","小升初","小学通用","初一","初二","初三","中考","初中通用","高一","高二",
  "高三","高考","高中通用","课外阅读","英语专项","语文作文","写字/字帖","奥数/竞赛"
] as const
//考试
const ExamTags = [
  "公务员","考研","外语考试","司法考试","会计类","银行类","教师类","医学/药学","建筑类","财税外贸保险类考试","计算机考试","其他考试"
] as const
//分类列表
const bookCategoryList = [
  {
    name: '小说',
    type: NovelTags,
  },
  {
    name: '文学',
    type: LiteratureTags
  },
  {
    name: '语言文字',
    type: LanguagesTags
  },
  {
    name: '历史',
    type: HistoryTags
  },
  {
    name: '地理',
    type: GeographicTags
  },
  {
    name: '艺术',
    type: ArtTags
  },
  {
    name: '政治',
    type: PoliticsTags
  },
  {
    name: '法律',
    type: LawTags
  },
  {
    name: '军事',
    type: MilitaryTags
  },
  {
    name: '哲学/心理',
    type: PhilosophyTags
  },
  {
    name: '宗教',
    type: ReligionTags
  },
  {
    name: '经济',
    type: EconomicTags
  },
  {
    name: '社会科学',
    type: SocialScienceTags
  },
  {
    name: '综合',
    type: ComprehensiveTags
  },
  {
    name: '童书',
    type: ChildrenTags
  },
  {
    name: '生活',
    type: LifeTags
  },
  {
    name: '体育',
    type: SportsTags
  },
  {
    name: '工程技术',
    type: EngineeringTags
  },
  {
    name: '互联网',
    type: InternetTags
  },
  {
    name: '自然科学',
    type: NaturalScienceTags
  },
  {
    name: '医药卫生',
    type: MedicineTags
  },
  {
    name: '教材',
    type: TextbookTags
  },
  {
    name: '教辅',
    type: TeachingAidsTags
  },
  {
    name: '考试',
    type: ExamTags
  }
]

const categoryChunks = computed(() => {
  const list = bookCategoryList
  const chunks = []
  for (let i = 0; i < list.length; i += 2) {
    chunks.push(list.slice(i, i + 2))
  }
  return chunks
})
const activeIndex = ref<number>(-1)
const lockRight = ref(false)
const handleWholeLeave = () => {
  lockRight.value = false
  activeIndex.value = -1
}
const tryHide = () => {
  if (!lockRight.value && activeIndex.value !== -1) {
    activeIndex.value = -1
  }
}
//转跳筛选页路由
const goToCategory = (id:number) => {
  router.push({
    path: '/filter',
    query: {
      categoryId: id
    }
  })
}
</script>

<template>
  <div class="category__container" @mouseleave="handleWholeLeave">
    <!--一级分类-->
    <div class="category__container--first">
      <!--标题-->
      <span class="category__title">图书</span>
      <!--一级分类-->
      <ul v-for="(item, idx) in categoryChunks" :key="idx" class="category__ul">
        <li @mouseenter="activeIndex = idx">
          <p v-for="(cat,offset) in item" :key="offset" @click="goToCategory((idx*2+offset)+1)">{{cat.name}}</p>
        </li>
      </ul>
    </div>
    <!--二级分类-->
    <div class="category__container--second" v-show="activeIndex !== -1 && false" @mouseenter="lockRight = true" @mouseleave="false; tryHide()">
      <div class="second__item" v-for="(item, idx) in categoryChunks[activeIndex]" :key="idx">
        <span>{{item.name}}</span>
        <div>
          <p v-for="name in item.type">{{name}}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
//分类容器
.category__container {
  position: relative;
}
//一级分类
.category__container--first {
  display: flex;
  flex-direction: column;
  //标题
  .category__title {
    border: 1px solid #ccc;
    width: 180px;
    font-weight: bold;
    font-size: large;
    color: white;
    background: #8f1b1b;
    padding: 4px 16px;
  }
}
//分类列表
.category__ul {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 0;
  margin: 0;
  list-style: none;
  //分类列表行
  li {
    border: 1px solid #ccc;
    display: flex;
    flex-direction: row;
    width: 180px;
    padding: 4px 14px;
    position: relative;
    margin-bottom: -1px;
    z-index: 0;
    //UI装饰
    &::after {
      content: '>';
      position: absolute;
      right: 4%;
    }
    //悬浮状态
    &:hover {
      border: 1px red solid;
      border-right: 1px solid transparent;
      color: red;
      z-index: 2;
    }
    //分类项
    p {
      cursor: pointer;
      font-size: small;
      margin-left: 4px;
      //UI装饰
      &:not(:last-child)::after {
        content: '/';
        margin-left: 2px;
      };
      //悬浮状态
      &:hover {
        text-decoration: underline;
      }
    }
  }
}
//二级分类
.category__container--second {
  border: 1px red solid;
  padding: 16px 24px;
  position: absolute;
  width: 640px;
  height: 380px;
  left: 179px;
  top: 0;
  z-index: 0;
  .second__item {
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    span {
      font-size: large;
      font-weight: bold;
      margin-bottom: 16px;
      &::before {
        content: '>';
        margin-right: 4px;
      }
    }
    div {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      p {
        font-size: small;
        &:not(:last-child)::after {
          content: '|';
          margin: 0 8px;
        }
        &:hover {
          text-decoration: underline;
          cursor: pointer;
          color: crimson;
        }
      }
    }
  }
}
</style>
<!--样式还有一部分尚未完善，book内容要搬到分类里去，或者图书也可以-->
<!--特点：分类锁机机制，优化体验-->
