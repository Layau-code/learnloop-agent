export type Locale = "zh-CN" | "en";

export const messages = {
  "zh-CN": {
    app: {
      brand: "LEARNLOOP",
      title: "单用户学习工作流",
      subtitle: "本地 clone、自配模型 API、配置后可用",
      mode: "Single-user / Local-first",
      skipToContent: "跳到主要内容",
      navigation: "主导航",
      nav: {
        overview: "总览",
        knowledge: "知识库",
        study: "学习工作台",
        reflection: "复盘计划",
        settings: "设置"
      },
      language: "语言"
    },
    home: {
      eyebrow: "Overview",
      title: "本地优先的个人学习 Agent",
      lede:
        "这个项目不是面向所有人的托管 SaaS，而是为单个学习者服务。喜欢这套流程的人可以直接 clone 到本地，配置自己的大模型 API 后开箱即用。",
      cards: [
        {
          label: "Single-user",
          title: "服务一个人，而不是运营平台",
          description: "当前产品默认只有一个使用者，重点是个人知识沉淀、问答、复盘和计划闭环。"
        },
        {
          label: "Local-first",
          title: "本地部署、自己掌控数据",
          description: "通过 Docker 在本地启动，资料、知识和运行状态都由使用者自己掌控。"
        },
        {
          label: "Bring your own model",
          title: "自己配置模型 API",
          description: "配置模型 API 后可获得更强的问答和沉淀效果；未配置时仍有本地 fallback。"
        }
      ]
    },
    settings: {
      eyebrow: "Settings",
      title: "本地配置与偏好",
      lede: "这里管理语言偏好和项目运行方式说明，后续再扩展模型、写作风格与个人偏好设置。",
      languageTitle: "界面语言",
      languageDescription: "默认是简体中文，也可以切换为英文。语言设置会保存在当前浏览器。",
      modeTitle: "运行方式",
      modeDescription:
        "LearnLoop Agent 设计为单用户、本地优先项目。推荐直接 clone 仓库，在本机配置 API 和环境后启动，而不是部署成面向所有人的共享服务。",
      zh: "简体中文",
      en: "English"
    },
    reflection: {
      eyebrow: "Reflection",
      title: "每日复盘与计划",
      lede: "复盘与计划页面还在开发中。当前阶段先把资料导入、知识沉淀和当前资料问答的主链路打稳。"
    },
    knowledge: {
      eyebrow: "Knowledge Base",
      title: "知识库浏览页",
      lede: "这里展示已经通过审批的知识条目。当前版本先支持列表、关键词搜索和正文预览。",
      searchLabel: "搜索",
      searchTitle: "按标题、主题或正文搜索",
      keyword: "关键词",
      keywordPlaceholder: "例如：agent memory / LangGraph / retrieval",
      loading: "正在加载知识条目...",
      updatedAt: "更新于",
      confidence: "置信度",
      empty: "知识库还是空的。先去学习工作台审批一条草稿，就能在这里看到结果。",
      general: "通用",
      itemCount: "条"
    },
    study: {
      eyebrow: "Study Workbench",
      title: "网页版最小闭环",
      lede: "先在浏览器里完成一条最小可演示路径：录入学习资料、生成沉淀草稿、审批写入知识库，并基于当前资料提问。",
      createLabel: "Create Material",
      createTitle: "录入学习资料",
      note: "手动笔记",
      url: "URL",
      titleField: "标题",
      titlePlaceholder: "例如：LangGraph persistence 笔记",
      sourceType: "输入类型",
      body: "正文",
      bodyPlaceholder: "把你正在学习的内容贴进来。",
      urlField: "URL",
      urlPlaceholder: "https://...",
      topicHint: "主题提示",
      topicHintPlaceholder: "例如：agent memory",
      importAction: "导入并生成草稿",
      importing: "导入中...",
      materialsLabel: "Materials",
      materialsTitle: "最近资料",
      loadingMaterials: "正在加载资料...",
      noMaterials: "还没有资料，先录入一条手动笔记试试。",
      general: "未设置主题",
      currentMaterialLabel: "Current Material",
      currentMaterialTitle: "解析结果与分块",
      currentMaterialEmpty: "选择一条资料后，这里会显示解析后的正文和 chunk。",
      unknownLanguage: "unknown",
      noBody: "暂无正文",
      chunksTitle: "分块",
      loadingChunks: "正在加载 chunks...",
      noChunks: "这条资料还没有可展示的 chunk。",
      draftsLabel: "Distill Drafts",
      draftsTitle: "待审批草稿",
      draftCount: "份草稿",
      draftsEmptyHint: "先选择一条资料，再查看这条资料生成的草稿。",
      noDrafts: "这条资料暂时还没有待审批草稿。",
      approve: "保存到知识库",
      reject: "拒绝",
      approved: "草稿已写入知识库。",
      rejected: "草稿已拒绝。",
      qaLabel: "Study QA",
      qaTitle: "基于当前资料提问",
      qaEmpty: "先选择一条资料，再在这里发起基于当前资料的问答。",
      qaQuestion: "问题",
      qaPlaceholder: "例如：这篇资料里为什么需要持久化 checkpoint？",
      ask: "提问",
      answering: "回答中...",
      threadReady: "当前会话",
      qaHistoryTitle: "问答记录",
      qaLoading: "正在加载问答记录...",
      qaNoMessages: "当前资料还没有问答记录，先问一个具体问题试试。",
      qaSuccess: "已生成基于当前资料的回答。",
      scopeLabel: "Study QA Scope",
      scopeTitle: "当前实现边界",
      supported: "已支持",
      supportedDescription: "仅基于当前选中资料的 chunk 做最小问答，并把问答记录写入 thread/message。",
      unsupported: "暂未支持",
      unsupportedDescription: "当前还没有 SSE、跨资料检索、正式 citations 表写入、问答转草稿。",
      you: "你",
      agent: "Agent",
      itemCount: "条",
      chunk: "Chunk"
    }
  },
  en: {
    app: {
      brand: "LEARNLOOP",
      title: "Single-user Learning Workflow",
      subtitle: "Clone locally and plug in your own model API",
      mode: "Single-user / Local-first",
      skipToContent: "Skip to main content",
      navigation: "Primary navigation",
      nav: {
        overview: "Overview",
        knowledge: "Knowledge",
        study: "Study",
        reflection: "Reflection",
        settings: "Settings"
      },
      language: "Language"
    },
    home: {
      eyebrow: "Overview",
      title: "A local-first personal learning agent",
      lede:
        "This project is not intended to be a hosted multi-user SaaS. It is designed for one learner at a time: clone the repo locally, configure your own model API, and start using it.",
      cards: [
        {
          label: "Single-user",
          title: "Built for one learner, not a platform",
          description: "The product is currently optimized for one person's study, distillation, QA, reflection, and planning loop."
        },
        {
          label: "Local-first",
          title: "Run locally and keep control of your data",
          description: "Use Docker locally so study materials, knowledge, and workflow state stay under the user's control."
        },
        {
          label: "Bring your own model",
          title: "Configure your own model API",
          description: "With an API key you get stronger QA and distillation; without it, the MVP still runs with local fallback behavior."
        }
      ]
    },
    settings: {
      eyebrow: "Settings",
      title: "Local configuration and preferences",
      lede: "Manage language preference and project runtime guidance here. Model, writing-style, and user-preference settings can expand later.",
      languageTitle: "Interface language",
      languageDescription: "Simplified Chinese is the default, and English is also available. The choice is stored in this browser.",
      modeTitle: "Operating mode",
      modeDescription:
        "LearnLoop Agent is designed as a single-user, local-first project. The recommended path is to clone the repo, configure your own API and environment locally, and run it yourself instead of turning it into a shared hosted service.",
      zh: "Simplified Chinese",
      en: "English"
    },
    reflection: {
      eyebrow: "Reflection",
      title: "Daily reflection and planning",
      lede: "The reflection and planning UI is still in progress. The current focus is stabilizing the material ingest, knowledge distillation, and selected-material QA loop."
    },
    knowledge: {
      eyebrow: "Knowledge Base",
      title: "Knowledge browser",
      lede: "This page shows approved knowledge items. The current version supports list browsing, keyword search, and a lightweight content preview.",
      searchLabel: "Search",
      searchTitle: "Search by title, topic, or content",
      keyword: "Keyword",
      keywordPlaceholder: "For example: agent memory / LangGraph / retrieval",
      loading: "Loading knowledge items...",
      updatedAt: "Updated",
      confidence: "Confidence",
      empty: "The knowledge base is still empty. Approve a draft from the Study page first and it will show up here.",
      general: "general",
      itemCount: "items"
    },
    study: {
      eyebrow: "Study Workbench",
      title: "Minimal browser workflow",
      lede: "The current goal is a visible browser flow: create study material, generate a draft, approve it into the knowledge base, and ask questions against the currently selected material.",
      createLabel: "Create Material",
      createTitle: "Add study material",
      note: "Manual note",
      url: "URL",
      titleField: "Title",
      titlePlaceholder: "For example: LangGraph persistence notes",
      sourceType: "Input type",
      body: "Body",
      bodyPlaceholder: "Paste the study content you are working on.",
      urlField: "URL",
      urlPlaceholder: "https://...",
      topicHint: "Topic hint",
      topicHintPlaceholder: "For example: agent memory",
      importAction: "Import and generate draft",
      importing: "Importing...",
      materialsLabel: "Materials",
      materialsTitle: "Recent materials",
      loadingMaterials: "Loading materials...",
      noMaterials: "No materials yet. Start by creating a manual note.",
      general: "No topic hint",
      currentMaterialLabel: "Current Material",
      currentMaterialTitle: "Parsed content and chunks",
      currentMaterialEmpty: "Select a material to inspect its parsed content and chunks.",
      unknownLanguage: "unknown",
      noBody: "No body available",
      chunksTitle: "Chunks",
      loadingChunks: "Loading chunks...",
      noChunks: "This material does not have visible chunks yet.",
      draftsLabel: "Distill Drafts",
      draftsTitle: "Drafts awaiting approval",
      draftCount: "drafts",
      draftsEmptyHint: "Select a material to inspect drafts generated from it.",
      noDrafts: "There are no pending drafts for this material yet.",
      approve: "Save to knowledge base",
      reject: "Reject",
      approved: "The draft has been written to the knowledge base.",
      rejected: "The draft has been rejected.",
      qaLabel: "Study QA",
      qaTitle: "Ask about the current material",
      qaEmpty: "Select a material before asking questions about it.",
      qaQuestion: "Question",
      qaPlaceholder: "For example: why does this material need persisted checkpoints?",
      ask: "Ask",
      answering: "Answering...",
      threadReady: "Session ready",
      qaHistoryTitle: "Question history",
      qaLoading: "Loading question history...",
      qaNoMessages: "There is no question history for this material yet. Start with one focused question.",
      qaSuccess: "A grounded answer has been generated from the current material.",
      scopeLabel: "Study QA Scope",
      scopeTitle: "Current implementation boundary",
      supported: "Supported",
      supportedDescription: "Minimal QA only against chunks from the currently selected material, with messages stored in thread/message records.",
      unsupported: "Not yet supported",
      unsupportedDescription: "No SSE, no cross-material retrieval, no formal citations table, and no question-to-draft flow yet.",
      you: "You",
      agent: "Agent",
      itemCount: "items",
      chunk: "Chunk"
    }
  }
} as const;

export type MessageCatalog = (typeof messages)[Locale];
