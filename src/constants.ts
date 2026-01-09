import { AudioSettings, TTSModel, VoiceMetadata, VoiceName } from './types';

export const DEFAULT_SETTINGS: AudioSettings = {
    voice: VoiceName.Zephyr,
    pitch: 0,
    speed: 1.0,
    volume: 1.0,
    format: 'wav',
};

export const SAMPLE_RATE = 24000;
export const PREVIEW_TEXT = "星云语音，让交流更有温度。";

export const VOICE_META: Record<VoiceName, VoiceMetadata> = {
    [VoiceName.Zephyr]: {
        id: VoiceName.Zephyr,
        name: 'Zephyr',
        gender: 'Female',
        tags: ['中文首选', '清晰', '高亮'],
        description: '发音最标准的通用女声，适合各类中文助手、通知及播报'
    },
    [VoiceName.Charon]: {
        id: VoiceName.Charon,
        name: 'Charon',
        gender: 'Male',
        tags: ['中文推荐', '威严', '深沉'],
        description: '稳重磁性的男声，咬字清晰，非常适合新闻播报或严肃叙事'
    },
    [VoiceName.Kore]: {
        id: VoiceName.Kore,
        name: 'Kore',
        gender: 'Female',
        tags: ['中文适用', '温柔', '治愈'],
        description: '放松平静的女声，适合情感电台、冥想引导或日常对话'
    },
    [VoiceName.Fenrir]: {
        id: VoiceName.Fenrir,
        name: 'Fenrir',
        gender: 'Male',
        tags: ['双语通用', '激昂', '有力'],
        description: '充满能量的男声，适合游戏解说、广告或快节奏内容'
    },
    [VoiceName.Puck]: {
        id: VoiceName.Puck,
        name: 'Puck',
        gender: 'Male',
        tags: ['双语通用', '质感', '叙事'],
        description: '略带沙哑的独特男声，适合有声书或需要情感张力的独白'
    },
    [VoiceName.Leda]: {
        id: VoiceName.Leda,
        name: 'Leda',
        gender: 'Female',
        tags: ['青春', '活泼'],
        description: '清脆悦耳的年轻女声，适合社交媒体、短视频、或者是充满活力的广告场景'
    },
    [VoiceName.Orus]: {
        id: VoiceName.Orus,
        name: 'Orus',
        gender: 'Male',
        tags: ['商务', '正式'],
        description: '稳重大方的男声，具有很强的信服力，非常适合企业宣传或商业演示'
    },
    [VoiceName.Aoede]: {
        id: VoiceName.Aoede,
        name: 'Aoede',
        gender: 'Female',
        tags: ['轻快', '自然'],
        description: '如同微风拂面般的自然嗓音，适合轻快的日常分享或生活化的播报'
    },
    [VoiceName.Callirrhoe]: {
        id: VoiceName.Callirrhoe,
        name: 'Callirrhoe',
        gender: 'Female',
        tags: ['轻松', '舒缓'],
        description: '节奏舒缓、语气柔和的女声，能够营造出安宁舒适的氛围'
    },
    [VoiceName.Autonoe]: {
        id: VoiceName.Autonoe,
        name: 'Autonoe',
        gender: 'Female',
        tags: ['明亮', '悦耳'],
        description: '发音饱满明亮的女声，无论是通知还是讲解都能清晰传递信息'
    },
    [VoiceName.Enceladus]: {
        id: VoiceName.Enceladus,
        name: 'Enceladus',
        gender: 'Male',
        tags: ['气声', '磁性'],
        description: '略带气声的磁性男声，非常有质感，适合电影配音或情感独白'
    },
    [VoiceName.Iapetus]: {
        id: VoiceName.Iapetus,
        name: 'Iapetus',
        gender: 'Male',
        tags: ['清晰', '冷静'],
        description: '语言表达极其清晰干练的男声，适合科技解析、学术报告等理性内容'
    },
    [VoiceName.Umbriel]: {
        id: VoiceName.Umbriel,
        name: 'Umbriel',
        gender: 'Male',
        tags: ['随性', '惬意'],
        description: '语气轻松自在的男声，就像在和老朋友聊天，适合生活博主或播客分享'
    },
    [VoiceName.Algieba]: {
        id: VoiceName.Algieba,
        name: 'Algieba',
        gender: 'Female',
        tags: ['平滑', '知性'],
        description: '如丝绸般顺滑的嗓音，流露着一种知性美，是深度长文阅读的最佳选择'
    },
    [VoiceName.Despina]: {
        id: VoiceName.Despina,
        name: 'Despina',
        gender: 'Female',
        tags: ['柔滑', '优雅'],
        description: '极具优雅韵味的美声，为你的内容增添一份尊贵感'
    },
    [VoiceName.Erinome]: {
        id: VoiceName.Erinome,
        name: 'Erinome',
        gender: 'Female',
        tags: ['清澈', '通透'],
        description: '宛如泉水般纯净透明的声音，听感非常直接且毫无修饰'
    },
    [VoiceName.Algenib]: {
        id: VoiceName.Algenib,
        name: 'Algenib',
        gender: 'Male',
        tags: ['粗犷', '力量'],
        description: '带有沙哑质感的硬朗男声，传达出强大的意志和力量感'
    },
    [VoiceName.Rasalgethi]: {
        id: VoiceName.Rasalgethi,
        name: 'Rasalgethi',
        gender: 'Male',
        tags: ['全能', '科普'],
        description: '最全能的科普讲解男声，自带一种权威、博学的专业感'
    },
    [VoiceName.Laomedeia]: {
        id: VoiceName.Laomedeia,
        name: 'Laomedeia',
        gender: 'Female',
        tags: ['俏皮', '可爱'],
        description: '灵动俏皮的声音，能够精准捕捉快乐的情绪，适合儿童内容或轻喜剧'
    },
    [VoiceName.Achernar]: {
        id: VoiceName.Achernar,
        name: 'Achernar',
        gender: 'Female',
        tags: ['柔软', '梦幻'],
        description: '如梦似幻的轻柔女声，适合助眠导读或需要静谧感的内容'
    },
    [VoiceName.Alnilam]: {
        id: VoiceName.Alnilam,
        name: 'Alnilam',
        gender: 'Male',
        tags: ['沉稳', '深厚'],
        description: '底蕴深沉的男声，给人一种脚踏实地的可靠感'
    },
    [VoiceName.Schedar]: {
        id: VoiceName.Schedar,
        name: 'Schedar',
        gender: 'Male',
        tags: ['平稳', '中立'],
        description: '语调四平八稳的中立男声，不带个人感情色彩，非常客观'
    },
    [VoiceName.Gacrux]: {
        id: VoiceName.Gacrux,
        name: 'Gacrux',
        gender: 'Male',
        tags: ['成熟', '阅历'],
        description: '充满故事感的成熟男声，适合回忆录或经典的叙述性文本'
    },
    [VoiceName.Pulcherrima]: {
        id: VoiceName.Pulcherrima,
        name: 'Pulcherrima',
        gender: 'Female',
        tags: ['直爽', '干脆'],
        description: '心直口快、豪爽的女声，非常适合具有说服性的演讲或快剪视频'
    },
    [VoiceName.Achird]: {
        id: VoiceName.Achird,
        name: 'Achird',
        gender: 'Male',
        tags: ['友好', '邻家'],
        description: '十分亲切友好的邻家大哥哥，适合教程、导游或亲子互动场景'
    },
    [VoiceName.Zubenelgenubi]: {
        id: VoiceName.Zubenelgenubi,
        name: 'Zubenelgenubi',
        gender: 'Male',
        tags: ['闲适', '低调'],
        description: '完全不紧不慢的悠闲嗓音，让听众彻底放松精神'
    },
    [VoiceName.Vindemiatrix]: {
        id: VoiceName.Vindemiatrix,
        name: 'Vindemiatrix',
        gender: 'Female',
        tags: ['贤淑', '端庄'],
        description: '尽显端庄贤淑气息的女声，适合介绍传统文化或温馨的家庭故事'
    },
    [VoiceName.Sadachbia]: {
        id: VoiceName.Sadachbia,
        name: 'Sadachbia',
        gender: 'Female',
        tags: ['动感', '元气'],
        description: '元气满满、充满跃动感的声音，为你的作品补充能量'
    },
    [VoiceName.Sadaltager]: {
        id: VoiceName.Sadaltager,
        name: 'Sadaltager',
        gender: 'Male',
        tags: ['专业', '说服力'],
        description: '充满职业智慧与信服力的声音，是制作咨询项目或专家演讲的首选'
    },
    [VoiceName.Sulafat]: {
        id: VoiceName.Sulafat,
        name: 'Sulafat',
        gender: 'Female',
        tags: ['高频', '穿透力'],
        description: '频率极佳且极具穿透力的女声，即使在嘈杂环境下也清晰可辨'
    }
};
