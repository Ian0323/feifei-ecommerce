const LINE_BOT_CONFIG = {
  mode: {
    enableMockReply: false,
    enableGroupReply: true,
    enableDirectReply: true,
    enableScheduledTopics: false
  },

  scope: {
    targetGroupOnly: true
  },

  replyPolicy: {
    group: {
      mentionReplyProbability: 1,
      productKeywordReplyProbability: 1,
      faqKeywordReplyProbability: 1,
      salesIntentReplyProbability: 1,
      genericReplyProbability: 0.02,
      maxRepliesPerHour: 3,
      consecutiveReplyLimit: 3
    },
    direct: {
      defaultReplyProbability: 1,
      useFaqFirst: true,
      fallbackToClaude: true
    }
  },

  cooldown: {
    enabled: true,
    afterConsecutiveReplies: 3,
    durationMinutes: 30,
    resetWindowMinutes: 60
  },

  quietHours: {
    enabled: true,
    startHour: 23,
    endHour: 8,
    suppressScheduledTopics: true,
    suppressGenericGroupReplies: true,
    allowMentionReply: true,
    allowDirectReply: true
  },

  keywords: {
    mentionAliases: ["小非", "@小非", "小非在嗎", "小非呢"],
    product: {
      purifying: ["淨化", "壓力大", "磁場亂", "想安靜", "整理自己", "負能量"],
      attraction: ["貴人", "人緣", "約會", "自信", "吸引力", "變漂亮"],
      prosperity: ["招財", "業績", "工作", "開工", "錢", "賺錢", "談合作"]
    },
    faq: {
      difference: ["差別", "差異", "哪一款", "怎麼選", "推薦哪個"],
      ordering: ["怎麼買", "怎麼下單", "下單", "購買", "表單"],
      pricing: ["多少", "價格", "售價", "多少錢", "價錢"],
      shipping: ["出貨", "多久到", "什麼時候寄", "物流"],
      store: ["商店", "官網", "連結", "網址"]
    },
    salesIntent: [
      "怎麼買",
      "下單",
      "有連結嗎",
      "官網",
      "網址",
      "多少錢",
      "價格",
      "表單",
      "噴霧",
      "香霧",
      "選物",
      "商店"
    ],
    escalation: {
      orderIssue: ["退款", "退貨", "客訴", "沒收到", "出貨問題", "訂單問題"],
      medicalOrSensitive: ["過敏", "懷孕", "醫生", "治療", "藥", "憂鬱", "焦慮"],
      abuseOrConflict: ["騙人", "爛", "生氣", "不爽", "要投訴"]
    }
  },

  escalation: {
    enabled: true,
    handoffTarget: "feifei",
    handoffMessage:
      "這類問題我先不亂回答，會比較建議直接找 feifei 本人確認，我也可以先幫你整理要問的重點。",
    categories: {
      orderIssue: {
        priority: "high",
        fallbackToClaude: false
      },
      medicalOrSensitive: {
        priority: "high",
        fallbackToClaude: false
      },
      abuseOrConflict: {
        priority: "medium",
        fallbackToClaude: false
      }
    }
  },

  topicScheduler: {
    enabled: false,
    slots: [
      { hour: 14, minute: 0 },
      { hour: 20, minute: 0 }
    ],
    maxTopicsPerDay: 2
  },

  claude: {
    model: "claude-sonnet-4-6",
    maxContextMessages: 8,
    maxReplySentences: 3,
    temperature: 0.7
  },

  links: {
    landingPageUrl: "https://ian0323.github.io/feifei-ecommerce/",
    wacaStoreUrl: "",
    lineOfficialUrl: ""
  },

  broadcasting: {
    enabled: true,
    path: "/internal/group-broadcast"
  }
};

module.exports = LINE_BOT_CONFIG;
