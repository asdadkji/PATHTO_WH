//订单
//映射
const BUSINESS_TYPE = {
    BOOK: '01'
} as const
const TRANSACTION_METHOD = {
    FACE_TO_FACE: 'F',
    ONLINE: 'O'
} as const
interface GenerateParams {
    businessType?: 'BOOK'
    transactionMethod?: 'FACE_TO_FACE' | 'ONLINE'
    userId?:number
}

export const generateOrderNumber = (params: GenerateParams = {}):string => {
    const {businessType = 'BOOK', transactionMethod = 'FACE_TO_FACE', userId = 0 } = params
    const prefix = 'ORD'
    const businessCode = BUSINESS_TYPE[businessType]
    const now = new Date()
    const dateTime = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, '0') +
        now.getDate().toString().padStart(2, '0') +
        now.getHours().toString().padStart(2, '0') +
        now.getMinutes().toString().padStart(2, '0') +
        now.getSeconds().toString().padStart(2, '0')
    const userCode = (userId % 10000).toString().padStart(4, '0')
    const transCode = TRANSACTION_METHOD[transactionMethod]
    const sequence = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const base = prefix + businessCode + dateTime + userCode + transCode + sequence
    return base
}
