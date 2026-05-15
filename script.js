// AI 平台真实提交渠道配置（无任何"自动推送"接口可用，全部为官方反馈/合作入口）
const AI_PLATFORMS = {
    doubao: {
        name: '豆包',
        emoji: '🤖',
        color: '#FF6B6B',
        officialUrl: 'https://www.doubao.com/',
        entryPath: '打开 APP → 我的 → 设置 → 意见反馈 → 选"内容建议"',
        contact: 'APP 内联系客服',
        successRate: 3,
        eta: '1–2 周'
    },
    qianwen: {
        name: '通义千问',
        emoji: '💬',
        color: '#4ECDC4',
        officialUrl: 'https://tongyi.aliyun.com/',
        entryPath: '网页右下"反馈" 或 APP → 我的 → 帮助与反馈 → 内容建议',
        contact: '阿里云客服 95187',
        successRate: 4,
        eta: '1–3 周'
    },
    yuanbao: {
        name: '腾讯元宝',
        emoji: '💎',
        color: '#FFD93D',
        officialUrl: 'https://yuanbao.tencent.com/',
        entryPath: '打开 APP → 我的 → 设置 → 意见反馈',
        contact: '微信公众号"腾讯客服"',
        successRate: 3,
        eta: '2–4 周'
    },
    kimi: {
        name: 'Kimi',
        emoji: '🌙',
        color: '#95E1D3',
        officialUrl: 'https://kimi.moonshot.cn/',
        entryPath: 'APP 内反馈，或邮件至 feedback@moonshot.cn',
        contact: 'feedback@moonshot.cn',
        successRate: 4,
        eta: '1–2 周'
    },
    wenxin: {
        name: '文心一言（百度）',
        emoji: '🎨',
        color: '#6C5CE7',
        officialUrl: 'https://yiyan.baidu.com/',
        entryPath: '强烈推荐：先去百度商家中心 https://b.baidu.com 注册商家并完善百度地图标注，文心会自动抓取',
        contact: '百度商家中心 b.baidu.com',
        successRate: 5,
        eta: '即时–1 周'
    },
    chatglm: {
        name: '智谱清言',
        emoji: '🧠',
        color: '#A8E6CF',
        officialUrl: 'https://chatglm.cn/',
        entryPath: '官网底部"联系我们"，或 APP → 我的 → 反馈',
        contact: '官网联系我们',
        successRate: 4,
        eta: '1–2 周'
    }
};

// 获取表单元素
const form = document.getElementById('submitForm');
const previewBtn = document.getElementById('previewBtn');
const previewModal = document.getElementById('previewModal');
const closePreviewBtn = document.getElementById('closePreview');
const resultSection = document.getElementById('resultSection');
const platformCards = document.getElementById('platformCards');
const summaryContent = document.getElementById('summaryContent');
const socialCards = document.getElementById('socialCards');

// 记录台账 / 草稿 相关元素
const recordsBtn = document.getElementById('recordsBtn');
const recordsModal = document.getElementById('recordsModal');
const recordsTbody = document.getElementById('recordsTbody');
const recordsCountEl = document.getElementById('recordsCount');
const exportCsvBtn = document.getElementById('exportCsvBtn');
const clearRecordsBtn = document.getElementById('clearRecordsBtn');
const draftTip = document.getElementById('draftTip');
const clearDraftBtn = document.getElementById('clearDraftBtn');

// localStorage key
const LS_DRAFT = 'mssyt_draft_v1';
const LS_RECORDS = 'mssyt_records_v1';
const LS_THEME = 'mssyt_theme_v1';
const LS_PROFILES = 'mssyt_profiles_v1';

// =============================================================
// 主题切换：light / dark / auto（跟随系统）
// =============================================================

function getStoredTheme() {
    try { return localStorage.getItem(LS_THEME); } catch (_) { return null; }
}

function applyTheme(theme) {
    // theme: 'light' | 'dark' | null（auto）
    const root = document.documentElement;
    if (theme === 'dark') {
        root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
        root.setAttribute('data-theme', 'light');
    } else {
        // auto：跟随系统
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    // 同步浏览器顶部状态栏颜色
    const isDark = root.getAttribute('data-theme') === 'dark';
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDark ? '#0a0a0a' : '#ffffff');
}

function initThemeToggle() {
    // 1. 启动时应用保存的偏好（没有则 auto）
    const stored = getStoredTheme();
    applyTheme(stored);

    // 2. auto 模式下监听系统切换
    if (!stored && window.matchMedia) {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        if (mq.addEventListener) mq.addEventListener('change', () => applyTheme(null));
        else if (mq.addListener) mq.addListener(() => applyTheme(null));
    }

    // 3. 绑定按钮：light <-> dark 切换（一旦点击即视为手动模式）
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            const cur = document.documentElement.getAttribute('data-theme');
            const next = cur === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(LS_THEME, next); } catch (_) {}
            applyTheme(next);
            if (typeof flashToast === 'function') {
                flashToast(next === 'dark' ? '🌙 已切到暗色' : '☀️ 已切到浅色');
            }
        });
    }
}

// 启动时立即应用主题（避免页面闪白）— 不等 DOMContentLoaded
applyTheme(getStoredTheme());

// =============================================================
// header 设置抽屉 + 步骤导航 + Sticky 浮动生成按钮
// =============================================================

// 抽屉:点 ⚙️ 展开 header-menu
function initHeaderMenu() {
    const btn = document.getElementById('headerMenuBtn');
    const menu = document.getElementById('headerMenu');
    if (!btn || !menu) return;

    const close = () => {
        menu.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        menu.setAttribute('aria-hidden', 'true');
    };
    const open = () => {
        menu.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        menu.setAttribute('aria-hidden', 'false');
    };

    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu.classList.contains('open')) close(); else open();
    });

    // 点击菜单项后自动关闭
    menu.querySelectorAll('.header-menu-item').forEach((item) => {
        item.addEventListener('click', () => setTimeout(close, 0));
    });

    // 点外面关闭
    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== btn) close();
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    // AI 配置按钮 → 打开 setup modal
    const aiBtn = document.getElementById('aiConfigBtn');
    if (aiBtn) aiBtn.addEventListener('click', () => {
        if (typeof openAiSetupModal === 'function') openAiSetupModal();
    });
}

// 刷新 header 抽屉里的 AI 配置状态文字
function refreshAiStatusText() {
    const el = document.getElementById('aiStatusText');
    if (!el) return;
    const cfg = getEffectiveAiConfig();
    if (cfg.isBuiltin) {
        el.textContent = '内建免配置';
    } else if (LLM_PROVIDERS[cfg.provider]) {
        el.textContent = LLM_PROVIDERS[cfg.provider].name.replace(/^[^\u4e00-\u9fa5A-Za-z]+/, '');
    }
}

// 步骤导航:点击锚点 + 滚动联动高亮
function initStepNav() {
    const nav = document.getElementById('stepNav');
    if (!nav) return;
    const items = Array.from(nav.querySelectorAll('.step-nav-item'));
    const sections = items
        .map((a) => document.querySelector(a.getAttribute('href')))
        .filter(Boolean);

    // 平滑滚动
    items.forEach((a) => {
        a.addEventListener('click', (e) => {
            const sel = a.getAttribute('href');
            const tgt = document.querySelector(sel);
            if (tgt) {
                e.preventDefault();
                const top = tgt.getBoundingClientRect().top + window.scrollY - 80;
                window.scrollTo({ top, behavior: 'smooth' });
                // 若是 details 且未展开,自动展开
                if (tgt.tagName === 'DETAILS' && !tgt.open) tgt.open = true;
            }
        });
    });

    // 滚动联动:用 IntersectionObserver 标记当前所在区
    if (sections.length && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((ent) => {
                if (ent.isIntersecting) {
                    const idx = sections.indexOf(ent.target);
                    if (idx >= 0) {
                        items.forEach((it, i) => it.classList.toggle('active', i === idx));
                    }
                }
            });
        }, { rootMargin: '-50% 0px -45% 0px', threshold: 0 });
        sections.forEach((s) => io.observe(s));
    }
}

// Sticky 浮动生成按钮:必填项填齐 + 滚出第一屏后显示
function initStickyGenerate() {
    const sticky = document.getElementById('stickyGenerate');
    const stickyBtn = document.getElementById('stickyGenerateBtn');
    const hintEl = document.getElementById('stickyGenerateHint');
    const form = document.getElementById('submitForm');
    if (!sticky || !stickyBtn || !form) return;

    // 点击 = 触发表单 submit
    stickyBtn.addEventListener('click', () => {
        // 用 requestSubmit 走完整 submit 流程(校验/事件)
        if (form.requestSubmit) form.requestSubmit();
        else form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    });

    const requiredFields = ['hostelName1', 'location', 'description', 'contact'];
    const requiredLabels = {
        hostelName1: '民宿名称',
        location: '位置',
        description: '介绍',
        contact: '联系方式'
    };

    const updateStickyState = () => {
        const missing = requiredFields.filter((id) => {
            const el = document.getElementById(id);
            return !el || !el.value.trim();
        });
        if (missing.length === 0) {
            stickyBtn.disabled = false;
            sticky.classList.remove('sticky-incomplete');
            if (hintEl) hintEl.textContent = '✓ 必填项已填齐，可以生成';
        } else {
            stickyBtn.disabled = false; // 允许点(校验交给 submit)
            sticky.classList.add('sticky-incomplete');
            if (hintEl) hintEl.textContent = `还差：${missing.map((id) => requiredLabels[id]).join('、')}`;
        }
    };

    // 滚动监听:超出第一屏才显示
    const headerEl = document.querySelector('header');
    const mainActions = document.getElementById('stepGenerate');
    const updateVisibility = () => {
        const headerBottom = headerEl ? headerEl.getBoundingClientRect().bottom : 0;
        const mainActionsRect = mainActions ? mainActions.getBoundingClientRect() : null;
        // 头部完全滚出后 && 表单内主按钮不可见时,显示 sticky
        const headerGone = headerBottom < 0;
        const inFormBtnVisible = mainActionsRect && mainActionsRect.top < window.innerHeight - 40 && mainActionsRect.bottom > 0;
        const resultSec = document.getElementById('resultSection');
        const resultsVisible = resultSec && resultSec.style.display !== 'none';
        if (headerGone && !inFormBtnVisible && !resultsVisible) {
            sticky.style.display = '';
            requestAnimationFrame(() => sticky.classList.add('visible'));
        } else {
            sticky.classList.remove('visible');
            // 等动画收完再隐藏
            setTimeout(() => {
                if (!sticky.classList.contains('visible')) sticky.style.display = 'none';
            }, 200);
        }
    };

    form.addEventListener('input', updateStickyState);
    form.addEventListener('change', updateStickyState);
    window.addEventListener('scroll', updateVisibility, { passive: true });
    window.addEventListener('resize', updateVisibility);

    // 初始
    updateStickyState();
    updateVisibility();
}

// =============================================================
// 多民宿档案系统
//   数据结构：{ profiles: [{id, name, data, createdAt, updatedAt}], activeId }
//   - 每个档案独立存表单内容
//   - 切换档案前自动把当前表单写回旧档案
// =============================================================

function genProfileId() {
    return 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6);
}

function loadProfileStore() {
    try {
        const raw = localStorage.getItem(LS_PROFILES);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && Array.isArray(parsed.profiles)) return parsed;
        }
    } catch (_) {}
    return null;
}

function saveProfileStore(store) {
    try { localStorage.setItem(LS_PROFILES, JSON.stringify(store)); } catch (_) {}
}

// 启动时确保至少有一个档案；如果发现老的 LS_DRAFT，迁移成默认档案
function ensureProfileStore() {
    let store = loadProfileStore();
    if (store && store.profiles.length > 0) return store;

    // 没有档案：尝试把老草稿迁移过来
    let initialData = null;
    try {
        const oldDraft = localStorage.getItem(LS_DRAFT);
        if (oldDraft) initialData = JSON.parse(oldDraft);
    } catch (_) {}

    const now = Date.now();
    const id = genProfileId();
    store = {
        profiles: [{
            id,
            name: '默认档案',
            data: initialData || {},
            createdAt: now,
            updatedAt: now
        }],
        activeId: id
    };
    saveProfileStore(store);
    return store;
}

function getActiveProfile() {
    const store = ensureProfileStore();
    const p = store.profiles.find((x) => x.id === store.activeId);
    return p || store.profiles[0];
}

// 把当前表单内容写回到 active profile
function persistFormToActiveProfile() {
    const store = ensureProfileStore();
    const active = store.profiles.find((x) => x.id === store.activeId);
    if (!active) return;
    active.data = getFormData();
    active.updatedAt = Date.now();
    saveProfileStore(store);
}

// 切换 active profile，先保存当前表单，再加载目标
function switchActiveProfile(targetId) {
    const store = ensureProfileStore();
    // 1. 保存当前表单到当前 active
    const cur = store.profiles.find((x) => x.id === store.activeId);
    if (cur) {
        cur.data = getFormData();
        cur.updatedAt = Date.now();
    }
    // 2. 切换
    const target = store.profiles.find((x) => x.id === targetId);
    if (!target) return;
    store.activeId = targetId;
    saveProfileStore(store);
    // 3. 应用到表单
    setFormData(target.data || {});
    refreshProfileBar();
    if (typeof flashToast === 'function') flashToast(`📁 已切换到「${target.name}」`);
}

function createNewProfile(name, copyFromCurrent) {
    const store = ensureProfileStore();
    // 先保存当前表单
    const cur = store.profiles.find((x) => x.id === store.activeId);
    if (cur) {
        cur.data = getFormData();
        cur.updatedAt = Date.now();
    }
    const now = Date.now();
    const id = genProfileId();
    const data = copyFromCurrent ? JSON.parse(JSON.stringify(cur ? cur.data : {})) : {};
    store.profiles.push({ id, name: name || ('新档案 ' + (store.profiles.length + 1)), data, createdAt: now, updatedAt: now });
    store.activeId = id;
    saveProfileStore(store);
    setFormData(data);
    refreshProfileBar();
    renderProfilesList();
    if (typeof flashToast === 'function') flashToast(copyFromCurrent ? '📋 已复制当前档案' : '✨ 已创建新档案');
}

function renameProfile(id, newName) {
    const store = ensureProfileStore();
    const p = store.profiles.find((x) => x.id === id);
    if (!p) return;
    p.name = newName || p.name;
    p.updatedAt = Date.now();
    saveProfileStore(store);
    refreshProfileBar();
    renderProfilesList();
}

function deleteProfile(id) {
    const store = ensureProfileStore();
    if (store.profiles.length <= 1) {
        alert('至少保留一个档案。如要清空内容请直接清空表单字段。');
        return;
    }
    const idx = store.profiles.findIndex((x) => x.id === id);
    if (idx === -1) return;
    const wasActive = store.activeId === id;
    store.profiles.splice(idx, 1);
    if (wasActive) {
        store.activeId = store.profiles[0].id;
        setFormData(store.profiles[0].data || {});
    }
    saveProfileStore(store);
    refreshProfileBar();
    renderProfilesList();
    if (typeof flashToast === 'function') flashToast('🗑 已删除档案');
}

function exportAllProfiles() {
    const store = ensureProfileStore();
    // 先把表单同步到 active 再导出
    persistFormToActiveProfile();
    const fresh = loadProfileStore();
    const blob = new Blob([JSON.stringify(fresh, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ts = new Date().toISOString().slice(0, 10);
    a.download = `民宿档案_${ts}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 300);
    if (typeof flashToast === 'function') flashToast('📥 已导出全部档案');
}

function importProfilesFromJson(jsonText, opts) {
    let parsed;
    try { parsed = JSON.parse(jsonText); } catch (e) {
        alert('JSON 解析失败：' + e.message);
        return;
    }
    if (!parsed || !Array.isArray(parsed.profiles)) {
        alert('文件格式不对。期望 { profiles: [...], activeId: "..." }');
        return;
    }
    const store = ensureProfileStore();
    const replace = !!(opts && opts.replace);
    if (replace) {
        store.profiles = parsed.profiles.map((p) => ({
            id: p.id || genProfileId(),
            name: p.name || '导入档案',
            data: p.data || {},
            createdAt: p.createdAt || Date.now(),
            updatedAt: p.updatedAt || Date.now()
        }));
        store.activeId = parsed.activeId && store.profiles.find((x) => x.id === parsed.activeId)
            ? parsed.activeId
            : store.profiles[0].id;
    } else {
        // 合并：用新 id 避免冲突
        parsed.profiles.forEach((p) => {
            store.profiles.push({
                id: genProfileId(),
                name: (p.name || '导入档案') + ' (导入)',
                data: p.data || {},
                createdAt: p.createdAt || Date.now(),
                updatedAt: Date.now()
            });
        });
    }
    saveProfileStore(store);
    setFormData((store.profiles.find((x) => x.id === store.activeId) || store.profiles[0]).data || {});
    refreshProfileBar();
    renderProfilesList();
    if (typeof flashToast === 'function') flashToast('📤 已导入档案');
}

// 顶部"当前档案"条
function refreshProfileBar() {
    const bar = document.getElementById('profileBar');
    const nameEl = document.getElementById('profileBarName');
    const countEl = document.getElementById('profileBarCount');
    if (!bar || !nameEl || !countEl) return;
    const store = ensureProfileStore();
    // 只有 2+ 档案才显示
    if (store.profiles.length <= 1) {
        bar.style.display = 'none';
        return;
    }
    const active = store.profiles.find((x) => x.id === store.activeId) || store.profiles[0];
    bar.style.display = '';
    nameEl.textContent = active.name;
    countEl.textContent = `（共 ${store.profiles.length} 份）`;
}

// 渲染档案列表（modal 里）
function renderProfilesList() {
    const list = document.getElementById('profilesList');
    if (!list) return;
    const store = ensureProfileStore();
    if (store.profiles.length === 0) {
        list.innerHTML = '<p class="records-empty">暂无档案</p>';
        return;
    }
    list.innerHTML = store.profiles.map((p) => {
        const isActive = p.id === store.activeId;
        const data = p.data || {};
        const preview = [];
        if (data.hostelName1) preview.push(escapeHtml(data.hostelName1));
        if (data.location)    preview.push(escapeHtml(data.location));
        const updated = new Date(p.updatedAt || Date.now()).toLocaleString('zh-CN', { hour12: false });
        return `
            <div class="profile-item${isActive ? ' active' : ''}" data-id="${p.id}">
                <div class="profile-item-main">
                    <div class="profile-item-name">
                        <span class="profile-item-emoji">${isActive ? '✓' : '📁'}</span>
                        <input type="text" class="profile-item-input" value="${escapeHtml(p.name)}" data-id="${p.id}" maxlength="40" />
                        ${isActive ? '<span class="profile-item-tag">当前</span>' : ''}
                    </div>
                    <div class="profile-item-meta">
                        ${preview.length ? preview.join(' · ') : '<em>空档案</em>'} · 更新于 ${escapeHtml(updated)}
                    </div>
                </div>
                <div class="profile-item-actions">
                    ${isActive ? '' : `<button type="button" class="btn-secondary profile-switch" data-id="${p.id}">切换到此</button>`}
                    <button type="button" class="btn-tool profile-delete" data-id="${p.id}" title="删除">🗑</button>
                </div>
            </div>
        `;
    }).join('');

    // 绑定事件
    list.querySelectorAll('.profile-switch').forEach((btn) => {
        btn.addEventListener('click', () => switchActiveProfile(btn.dataset.id));
    });
    list.querySelectorAll('.profile-delete').forEach((btn) => {
        btn.addEventListener('click', () => {
            if (confirm('确定删除这份档案吗？此操作不可恢复。')) deleteProfile(btn.dataset.id);
        });
    });
    list.querySelectorAll('.profile-item-input').forEach((inp) => {
        inp.addEventListener('change', () => renameProfile(inp.dataset.id, inp.value.trim() || '未命名档案'));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') inp.blur(); });
    });
}

function openProfilesModal() {
    // 打开前先把当前表单同步到 active profile
    persistFormToActiveProfile();
    renderProfilesList();
    const modal = document.getElementById('profilesModal');
    if (modal) modal.style.display = 'block';
}

function initProfilesUI() {
    const openBtn = document.getElementById('profilesBtn');
    const barManageBtn = document.getElementById('profileBarManage');
    const modal = document.getElementById('profilesModal');
    const closeBtn = modal ? modal.querySelector('.close') : null;
    const newBtn = document.getElementById('profileNewBtn');
    const dupBtn = document.getElementById('profileDupBtn');
    const importBtn = document.getElementById('profileImportBtn');
    const exportBtn = document.getElementById('profileExportBtn');
    const fileInput = document.getElementById('profileImportFile');

    if (openBtn) openBtn.addEventListener('click', openProfilesModal);
    if (barManageBtn) barManageBtn.addEventListener('click', openProfilesModal);
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });

    // 点 modal 背景关闭
    if (modal) {
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    }

    if (newBtn) newBtn.addEventListener('click', () => {
        const name = prompt('给新档案起个名字（例如：山水间民宿 / 云端小院）');
        if (name === null) return; // 用户取消
        createNewProfile(name.trim() || '新档案');
    });

    if (dupBtn) dupBtn.addEventListener('click', () => {
        const cur = getActiveProfile();
        const name = prompt('复制后的档案名', (cur.name || '档案') + ' 副本');
        if (name === null) return;
        createNewProfile(name.trim() || (cur.name + ' 副本'), true);
    });

    if (exportBtn) exportBtn.addEventListener('click', exportAllProfiles);

    if (importBtn && fileInput) {
        importBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                const text = ev.target.result;
                const replace = confirm('是否覆盖现有档案？\n\n确定 = 清空已有档案再导入\n取消 = 与现有档案合并（保留全部）');
                importProfilesFromJson(text, { replace });
                fileInput.value = '';
            };
            reader.readAsText(file);
        });
    }

    // 初始：渲染顶部条
    refreshProfileBar();
}

// 文案风格列表（用于卡片"换一版"按钮循环切换）
const TEXT_STYLES = [
    { id: 'formal',   name: '商务正式版' },
    { id: 'friendly', name: '亲切口语版' },
    { id: 'data',     name: '数据卖点版' },
    { id: 'story',    name: '故事情怀版' }
];
const ENRICH_MAX = 3;

// 生成官方提交文案
//   options.style: 'formal'(默认) | 'friendly' | 'data' | 'story'
//   options.enrichLevel: 0..3，叠加附加段（周边玩法 / 用户画像 / 合作细节）
function generateSubmissionText(formData, platformName, options) {
    const opts = options || {};
    const style = opts.style || 'formal';
    let enrich = parseInt(opts.enrichLevel, 10);
    if (!isFinite(enrich) || enrich < 0) enrich = 0;
    if (enrich > ENRICH_MAX) enrich = ENRICH_MAX;

    let text;
    switch (style) {
        case 'friendly': text = styleFriendly(formData, platformName); break;
        case 'data':     text = styleData(formData, platformName); break;
        case 'story':    text = styleStory(formData, platformName); break;
        case 'formal':
        default:         text = styleFormal(formData, platformName); break;
    }

    if (enrich >= 1) text += '\n' + enrichBlock1(formData) + '\n';
    if (enrich >= 2) text += '\n' + enrichBlock2(formData) + '\n';
    if (enrich >= 3) text += '\n' + enrichBlock3(formData) + '\n';

    return text;
}

// ---- 风格 1：商务正式版（即原版） ----
function styleFormal(formData, platformName) {
    const hostels = [formData.hostelName1];
    if (formData.hostelName2) hostels.push(formData.hostelName2);
    const team = platformName ? `${platformName}团队` : '平台团队';

    let text = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `标题：民宿信息收录申请 - ${hostels[0]}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    text += `尊敬的${team}：\n\n`;
    text += `您好！我是${hostels[0]}的经营者。希望贵平台在用户咨询\n`;
    text += `"${formData.location}民宿推荐"等相关问题时，能够推荐我们的民宿。\n\n`;

    text += `【民宿基本信息】\n`;
    text += `名称：${hostels.join('、')}\n`;
    text += `位置：${formData.location}\n`;
    if (formData.price) text += `价格：${formData.price}\n`;
    text += `特色：${formData.description.substring(0, 100)}${formData.description.length > 100 ? '...' : ''}\n`;
    text += `联系方式：${formData.contact}\n\n`;

    if (formData.videoLinks || formData.imageLinks || formData.noteLinks) {
        text += `【线上资料】\n`;
        if (formData.videoLinks) {
            const videos = formData.videoLinks.split('\n').filter((l) => l.trim());
            text += `视频链接：\n`;
            videos.slice(0, 3).forEach((l) => (text += `- ${l.trim()}\n`));
        }
        if (formData.noteLinks) {
            const notes = formData.noteLinks.split('\n').filter((l) => l.trim());
            text += `笔记/文章：\n`;
            notes.slice(0, 3).forEach((l) => (text += `- ${l.trim()}\n`));
        }
        text += `\n`;
    }

    text += `【合作意向】\n`;
    text += `我们愿意为贵平台用户提供专属优惠，并长期保持合作。\n`;
    text += `期待您的回复！\n\n`;
    text += `联系人：${formData.contact}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    return text;
}

// ---- 风格 2：亲切口语版 ----
function styleFriendly(formData, platformName) {
    const hostels = [formData.hostelName1];
    if (formData.hostelName2) hostels.push(formData.hostelName2);
    const team = platformName ? `${platformName} 的小伙伴` : '小伙伴';

    let t = `Hi ${team} 👋\n\n`;
    t += `我是 ${hostels[0]} 的店长（${formData.contact}）。\n`;
    t += `今天来跟你们说说我们这家在 ${formData.location} 的小店。\n\n`;
    t += `要是有人问"${formData.location}有什么值得住的民宿"，\n`;
    t += `希望能想到我们 ❤️\n\n`;

    t += `▎我们是谁\n`;
    t += `${hostels.join(' & ')}，开在 ${formData.location}`;
    if (formData.price) t += `（${formData.price}）`;
    t += `。\n\n`;

    t += `▎特别的地方\n${formData.description}\n\n`;

    if (formData.videoLinks || formData.noteLinks) {
        t += `▎想多了解可以看\n`;
        if (formData.videoLinks) {
            formData.videoLinks.split('\n').filter((l) => l.trim()).slice(0, 3)
                .forEach((l) => (t += `🎥 ${l.trim()}\n`));
        }
        if (formData.noteLinks) {
            formData.noteLinks.split('\n').filter((l) => l.trim()).slice(0, 3)
                .forEach((l) => (t += `📝 ${l.trim()}\n`));
        }
        t += `\n`;
    }

    t += `▎我能配合什么\n`;
    t += `专属粉丝价、真实入住反馈、定期更新最新照片，都可以提供。\n`;
    t += `不打扰啦，谢谢你看到这里 🙏\n\n`;
    t += `店长：${formData.contact}\n`;
    return t;
}

// ---- 风格 3：数据卖点版（适合 AI/算法收录的结构化感）----
function styleData(formData, platformName) {
    const hostels = [formData.hostelName1];
    if (formData.hostelName2) hostels.push(formData.hostelName2);
    const loc = formData.location;
    const keywords = [
        `${loc}民宿`, `${loc}住宿`, `${loc}周末游`, `${loc}亲子`,
        `${loc}周边`, hostels[0], '出片民宿', '小众民宿'
    ].filter(Boolean);

    let t = `【${platformName || '内容'}收录申请单】\n`;
    t += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    t += `■ 主体名称：${hostels.join(' / ')}\n`;
    t += `■ 业务类型：精品民宿 / 短租住宿\n`;
    t += `■ 详细地址：${loc}\n`;
    if (formData.price) t += `■ 价格区间：${formData.price}\n`;
    t += `■ 联系方式：${formData.contact}\n\n`;

    t += `■ 推荐关键词（可用于平台问答匹配）：\n`;
    t += keywords.map((k) => `  · ${k}`).join('\n') + '\n\n';

    t += `■ 适用问答场景：\n`;
    t += `  · "${loc}有什么好的民宿推荐？"\n`;
    t += `  · "${loc}周末去哪住比较有特色？"\n`;
    t += `  · "${loc}带孩子/拍照/团建的民宿？"\n\n`;

    t += `■ 核心卖点：\n${formData.description}\n\n`;

    if (formData.videoLinks || formData.noteLinks) {
        t += `■ 内容素材：\n`;
        if (formData.videoLinks) {
            const vs = formData.videoLinks.split('\n').filter((l) => l.trim()).slice(0, 3);
            t += `  视频：\n` + vs.map((l) => `    ${l.trim()}`).join('\n') + '\n';
        }
        if (formData.noteLinks) {
            const ns = formData.noteLinks.split('\n').filter((l) => l.trim()).slice(0, 3);
            t += `  图文：\n` + ns.map((l) => `    ${l.trim()}`).join('\n') + '\n';
        }
        t += '\n';
    }

    t += `━━━━━━━━━━━━━━━━━━━━━\n`;
    t += `提交人：${formData.contact}\n`;
    return t;
}

// ---- 风格 4：故事情怀版 ----
function styleStory(formData, platformName) {
    const hostels = [formData.hostelName1];
    if (formData.hostelName2) hostels.push(formData.hostelName2);
    const teamLine = platformName ? `致 ${platformName} 团队：` : `给认真看推荐的你：`;

    let t = `${teamLine}\n\n`;
    t += `开这家民宿之前，我从来没有想过会和 AI 团队写信。\n`;
    t += `但既然时代变了，那就讲讲 ${hostels[0]} 的故事吧。\n\n`;
    t += `${hostels[0]} 在 ${formData.location}。\n`;

    const firstSentence = (formData.description || '').split(/[。；;\n]/)[0] || '它够安静、够真诚';
    t += `当初选这里，是因为 ${firstSentence.trim()}。\n\n`;

    t += `每一位住进来的客人，我都想让他们记住几件小事：\n`;
    const lines = (formData.description || '').split(/[\n。；;]/).filter((s) => s.trim().length > 4).slice(0, 4);
    if (lines.length === 0) lines.push('被一杯茶接住的清晨');
    lines.forEach((s, i) => (t += `${i + 1}. ${s.trim()}\n`));
    t += `\n`;

    if (formData.price) t += `价格我们尽量友好（${formData.price}），\n`;
    t += `因为我们更想结交合得来的人，而不是赚一锤子买卖。\n\n`;

    t += `如果在 ${platformName || '你们的'} AI 助手里，有人问"${formData.location}有什么值得停留的地方"，\n`;
    t += `希望能让 ${hostels[0]} 出现在答案里。\n`;
    t += `我们会用心接待每一个被推荐过来的人。\n\n`;

    if (formData.noteLinks || formData.videoLinks) {
        t += `相关内容可以从这里看到：\n`;
        if (formData.videoLinks) t += `${formData.videoLinks.split('\n')[0].trim()}\n`;
        if (formData.noteLinks) t += `${formData.noteLinks.split('\n')[0].trim()}\n`;
        t += `\n`;
    }

    t += `——\n${hostels[0]} 主理人\n联系：${formData.contact}\n`;
    return t;
}

// ---- 丰富块 1：周边玩法 / 交通 ----
function enrichBlock1(formData) {
    return [
        `【附1：周边玩法 / 交通】`,
        `· 推荐场景：周末 / 亲子 / 情侣 / 团建 / 工作日远程办公`,
        `· 周边定位：以 ${formData.location} 为中心，半径 5 公里内有当地代表性景点`,
        `· 怎么到：高铁站 / 机场 / 自驾导航直接搜店名即可`,
        `· 适合几人：家庭 / 朋友 2-8 人，可拼房`,
        `· 早餐：提供本地特色早餐（具体见预订页）`
    ].join('\n');
}

// ---- 丰富块 2：客人画像 ----
function enrichBlock2(formData) {
    return [
        `【附2：典型客人画像】`,
        `我们 80% 客人来自：`,
        `  · 25-45 岁，城市白领 / 小家庭`,
        `  · 习惯在出发前用 AI 助手查目的地`,
        `  · 对"氛围感、出片度、性价比"高敏感`,
        `  · 重视真实评价，反感套路营销`,
        `他们最关心 3 件事：`,
        `  1. 房间真实是否如图`,
        `  2. 周边能否一站式解决吃喝玩`,
        `  3. 老板是否真诚、是否有当地人推荐`,
        `这 3 件事，我们都做到了。`
    ].join('\n');
}

// ---- 丰富块 3：合作配合细节 ----
function enrichBlock3(formData) {
    return [
        `【附3：合作配合细节】`,
        `若贵平台愿意收录我们的信息，我们可以提供：`,
        `  1. 平台专属优惠码（联系 ${formData.contact} 同步开通）`,
        `  2. 月度真实入住数据反馈（入住率 / 好评率 / 退订率）`,
        `  3. 用户原创内容（UGC）授权使用`,
        `  4. 配合内容共创 / 采访 / 直播探店`,
        `  5. 信息更新承诺：每季度主动同步价格、设施、政策变更`,
        `期待和贵平台长期共建优质内容，让真正用心做民宿的人被看见。`
    ].join('\n');
}

// =============================================================
// 文案体检：给生成的文案打分 + 给出可操作的改进建议
// =============================================================

// 每个 AI 平台偏好的字数区间
const PLATFORM_LENGTH_PREF = {
    doubao:   { min: 220, ideal: [280, 480], max: 800 },
    qianwen:  { min: 280, ideal: [350, 600], max: 900 },
    yuanbao:  { min: 220, ideal: [280, 480], max: 800 },
    kimi:     { min: 260, ideal: [320, 550], max: 900 },
    wenxin:   { min: 220, ideal: [280, 500], max: 800 },
    chatglm:  { min: 220, ideal: [280, 500], max: 800 }
};

// 卖点 / 描述强度词库（出现这些词通常意味着具象 / 数字化卖点）
const STRONG_KEYWORDS = [
    /\d+\s*[米m分钟小时分天]/g,   // 数字 + 时间/距离单位
    /\d+\s*[人间元]/g,             // 房间/价格量化
    /(早餐|含早|双人床|大床|榻榻米|温泉|独栋|独立|阳台|露台|庭院|院子|花园|泳池|湖景|山景|海景|江景|景观)/g,
    /(亲子|遛娃|团建|蜜月|情侣|包栋|包院|私汤|烧烤|篝火|烟花|手作|采摘)/g,
    /(古镇|景区|地铁|高铁|机场|步行|车程|分钟)/g,
    /(WiFi|wifi|空调|地暖|新风|24h|24小时|管家|接送|代订)/g
];

// 检测核心信息是否齐全
function detectCoreInfoCoverage(text, formData) {
    const out = { items: [], hit: 0, total: 4 };
    const lower = text.toLowerCase();
    const has = (s) => s && (text.includes(s) || lower.includes(String(s).toLowerCase()));

    // 1. 民宿名出现过
    const nameHit = has(formData.hostelName1) || (formData.hostelName2 && has(formData.hostelName2));
    out.items.push({ name: '民宿名称', ok: !!nameHit, fix: nameHit ? '' : '在文案中明确写出民宿名' });
    if (nameHit) out.hit++;

    // 2. 位置出现过（含位置或位置的字段）
    const locHit = formData.location && has(formData.location.slice(0, 4));
    out.items.push({ name: '所在位置', ok: !!locHit, fix: locHit ? '' : '加入位置/城市/景区名' });
    if (locHit) out.hit++;

    // 3. 联系方式出现过
    const cHit = formData.contact && has(formData.contact.slice(0, 4));
    out.items.push({ name: '联系方式', ok: !!cHit, fix: cHit ? '' : '附上联系方式（电话/微信/官网）' });
    if (cHit) out.hit++;

    // 4. 价格区间（无填写时此项不扣分，按"自动通过"处理）
    let priceHit = true;
    if (formData.price) {
        priceHit = has(formData.price.slice(0, 3)) || /\d+\s*[元¥]/.test(text);
        out.items.push({ name: '价格区间', ok: priceHit, fix: priceHit ? '' : '让 AI 能匹配预算搜索：在文案里加入"约 XXX 元/晚"等价位' });
    } else {
        out.items.push({ name: '价格区间', ok: true, fix: '', skipped: true });
    }
    if (priceHit) out.hit++;

    return out;
}

// 检测卖点密度
function detectSellingPointDensity(text) {
    let matches = 0;
    STRONG_KEYWORDS.forEach((re) => {
        const m = text.match(re);
        if (m) matches += m.length;
    });
    const chars = text.length;
    const density = chars > 0 ? matches / (chars / 100) : 0; // 每 100 字命中数
    return { matches, density, chars };
}

// 检测句式多样性
function detectSentenceVariety(text) {
    const sentences = text.split(/[。！？\n.!?]/).map((s) => s.trim()).filter((s) => s.length > 0);
    if (sentences.length === 0) return { count: 0, avgLen: 0, variety: 0 };
    const lens = sentences.map((s) => s.length);
    const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
    // variance / avg 越大，多样性越高
    const variance = lens.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / lens.length;
    const variety = avg > 0 ? Math.min(100, (Math.sqrt(variance) / avg) * 100) : 0;
    return { count: sentences.length, avgLen: avg, variety };
}

// 综合评分：返回 { score: 0-100, level, breakdown: [...] }
function scoreContent(text, formData, platformId) {
    const breakdown = [];

    // —— 维度 1：核心信息完整度（权重 30）——
    const coreInfo = detectCoreInfoCoverage(text, formData);
    const coreScore = Math.round((coreInfo.hit / coreInfo.total) * 30);
    breakdown.push({
        key: 'core',
        label: '核心信息',
        score: coreScore,
        max: 30,
        detail: coreInfo.items.map((it) => ({
            name: it.name,
            ok: it.ok,
            skipped: !!it.skipped,
            fix: it.fix
        })),
        hint: coreInfo.hit === coreInfo.total
            ? '✅ 民宿名 / 位置 / 联系 / 价格 都已覆盖。'
            : `还缺：${coreInfo.items.filter(i => !i.ok && !i.skipped).map(i => i.name).join('、')}`
    });

    // —— 维度 2：字数适宜（权重 20）——
    const pref = PLATFORM_LENGTH_PREF[platformId] || { min: 200, ideal: [300, 500], max: 800 };
    const len = text.length;
    let lengthScore = 0;
    let lengthHint = '';
    if (len < pref.min) {
        lengthScore = Math.max(0, Math.round((len / pref.min) * 12));
        lengthHint = `偏短（${len} 字）。建议加到 ${pref.ideal[0]}-${pref.ideal[1]} 字（点 ✨丰富细节 可一键扩写）`;
    } else if (len >= pref.ideal[0] && len <= pref.ideal[1]) {
        lengthScore = 20;
        lengthHint = `✅ 字数适中（${len} 字，理想区间 ${pref.ideal[0]}-${pref.ideal[1]}）`;
    } else if (len < pref.ideal[0]) {
        lengthScore = 16;
        lengthHint = `略短（${len} 字）。理想 ${pref.ideal[0]}-${pref.ideal[1]} 字`;
    } else if (len <= pref.max) {
        lengthScore = 17;
        lengthHint = `略长（${len} 字）。理想 ${pref.ideal[0]}-${pref.ideal[1]} 字（AI 偏好简洁）`;
    } else {
        lengthScore = 10;
        lengthHint = `过长（${len} 字）。建议精简到 ${pref.ideal[1]} 字内（点 ↺ 重置后只选风格不叠加附加段）`;
    }
    breakdown.push({ key: 'length', label: '字数适宜', score: lengthScore, max: 20, hint: lengthHint });

    // —— 维度 3：卖点密度（权重 25）——
    const sp = detectSellingPointDensity(text);
    let sellScore;
    let sellHint;
    if (sp.density >= 2.0) {
        sellScore = 25;
        sellHint = `✅ 卖点密集（每 100 字命中 ${sp.density.toFixed(1)} 个具体卖点词）`;
    } else if (sp.density >= 1.2) {
        sellScore = 20;
        sellHint = `卖点合格（密度 ${sp.density.toFixed(1)}/100字）。可补充：含早 / 包院 / 距XX景区 X 公里 等具象描述`;
    } else if (sp.density >= 0.6) {
        sellScore = 14;
        sellHint = `卖点偏稀（密度 ${sp.density.toFixed(1)}/100字）。建议多用数字（步行3分钟、双人大床、24h热水）`;
    } else {
        sellScore = 8;
        sellHint = `卖点不足（密度 ${sp.density.toFixed(1)}/100字）。建议：让 ✨AI 润色 帮你扩写成专业卖点版`;
    }
    breakdown.push({ key: 'selling', label: '卖点密度', score: sellScore, max: 25, hint: sellHint });

    // —— 维度 4：句式多样性（权重 15）——
    const sv = detectSentenceVariety(text);
    let varScore;
    let varHint;
    if (sv.count < 5) {
        varScore = 6;
        varHint = `句子偏少（${sv.count} 句）。AI 喜欢能拆成多条信息的结构化文本`;
    } else if (sv.variety >= 40) {
        varScore = 15;
        varHint = `✅ 句式有节奏感（${sv.count} 句，平均 ${Math.round(sv.avgLen)} 字/句）`;
    } else if (sv.variety >= 25) {
        varScore = 12;
        varHint = `句式比较均匀（${sv.count} 句）。短句长句穿插会更有节奏`;
    } else {
        varScore = 8;
        varHint = `句长太接近（缺乏节奏）。建议换一种文案风格（点击 🎨）`;
    }
    breakdown.push({ key: 'variety', label: '句式节奏', score: varScore, max: 15, hint: varHint });

    // —— 维度 5：素材富集度（权重 10）——
    const hasVideo = !!(formData.videoLinks && formData.videoLinks.trim());
    const hasImage = !!(formData.imageLinks && formData.imageLinks.trim());
    const hasNote = !!(formData.noteLinks && formData.noteLinks.trim());
    const mediaHit = [hasVideo, hasImage, hasNote].filter(Boolean).length;
    const mediaScore = Math.round((mediaHit / 3) * 10);
    let mediaHint;
    if (mediaScore === 10) mediaHint = '✅ 视频 / 图片 / 笔记 素材齐全';
    else if (mediaHit === 0) mediaHint = '没填任何素材链接。回表单第二步加上视频/图片/笔记链接可大幅提升收录率';
    else mediaHint = `素材部分缺失（已填 ${mediaHit}/3 种）。补全 ${!hasVideo ? '视频、' : ''}${!hasImage ? '图片、' : ''}${!hasNote ? '笔记' : ''}`.replace(/、$/, '');
    breakdown.push({ key: 'media', label: '素材富集', score: mediaScore, max: 10, hint: mediaHint });

    // —— 汇总 ——
    const total = breakdown.reduce((a, b) => a + b.score, 0);
    let level;
    if (total >= 85) level = { tag: 'excellent', label: '优秀' };
    else if (total >= 70) level = { tag: 'good', label: '良好' };
    else if (total >= 55) level = { tag: 'okay', label: '及格' };
    else level = { tag: 'poor', label: '待优化' };

    return { score: total, level, breakdown };
}

// 渲染评分徽章（用于平台卡片头部，点击展开底部详细诊断）
function renderScoreBadge(scoreResult) {
    const { score, level } = scoreResult;
    return `<button type="button" class="score-badge score-${level.tag}" title="点击查看详细诊断" data-action="open-score-detail">
        <span class="score-num">${score}</span><span class="score-suffix">/100</span>
        <span class="score-level">${level.label}</span>
        <span class="score-badge-arrow">▾</span>
    </button>`;
}

// 渲染评分详细诊断（用于平台卡片内的 details）
function renderScoreDetail(scoreResult) {
    const { score, level, breakdown } = scoreResult;
    const dimsHtml = breakdown.map((d) => {
        const pct = Math.round((d.score / d.max) * 100);
        const barTone = pct >= 80 ? 'good' : pct >= 50 ? 'okay' : 'poor';
        let coreItemsHtml = '';
        if (d.key === 'core' && Array.isArray(d.detail)) {
            coreItemsHtml = '<ul class="score-core-items">' + d.detail.map((it) => {
                if (it.skipped) return `<li class="score-core-skip">○ ${escapeHtml(it.name)} <small>（你没填，已跳过）</small></li>`;
                return it.ok
                    ? `<li class="score-core-ok">✓ ${escapeHtml(it.name)}</li>`
                    : `<li class="score-core-bad">✗ ${escapeHtml(it.name)} <small>→ ${escapeHtml(it.fix)}</small></li>`;
            }).join('') + '</ul>';
        }
        return `
            <li class="score-dim">
                <div class="score-dim-head">
                    <span class="score-dim-name">${escapeHtml(d.label)}</span>
                    <span class="score-dim-num">${d.score}<small>/${d.max}</small></span>
                </div>
                <div class="score-bar"><div class="score-bar-fill score-fill-${barTone}" style="width:${pct}%"></div></div>
                <p class="score-dim-hint">${escapeHtml(d.hint)}</p>
                ${coreItemsHtml}
            </li>
        `;
    }).join('');

    return `
        <div class="score-detail">
            <div class="score-detail-head">
                <strong>${score}/100 · ${escapeHtml(level.label)}</strong>
                <span class="score-detail-sub">基于「核心信息 / 字数 / 卖点 / 句式 / 素材」5 个维度</span>
            </div>
            <ul class="score-dims">${dimsHtml}</ul>
        </div>
    `;
}

// 生成推广内容
function generatePromotionContent(formData) {
    const hostels = [formData.hostelName1];
    if (formData.hostelName2) {
        hostels.push(formData.hostelName2);
    }

    let content = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🏡 民宿推广内容\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // 基本信息
    content += `【民宿名称】\n${hostels.join('、')}\n\n`;
    content += `【所在位置】\n${formData.location}\n\n`;
    
    if (formData.price) {
        content += `【价格区间】\n${formData.price}\n\n`;
    }
    
    content += `【特色介绍】\n${formData.description}\n\n`;
    content += `【联系方式】\n${formData.contact}\n\n`;

    // 媒体内容
    const hasMedia = formData.videoLinks || formData.imageLinks || formData.noteLinks;
    if (hasMedia) {
        content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        content += `📸 宣传素材\n`;
        content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    if (formData.videoLinks) {
        const videos = formData.videoLinks.split('\n').filter(link => link.trim());
        content += `【视频展示】（${videos.length}个）\n`;
        videos.forEach((link, index) => {
            content += `${index + 1}. ${link.trim()}\n`;
        });
        content += `\n`;
    }

    if (formData.imageLinks) {
        const images = formData.imageLinks.split('\n').filter(link => link.trim());
        content += `【图片展示】（${images.length}张）\n`;
        images.forEach((link, index) => {
            content += `${index + 1}. ${link.trim()}\n`;
        });
        content += `\n`;
    }

    if (formData.noteLinks) {
        const notes = formData.noteLinks.split('\n').filter(link => link.trim());
        content += `【相关笔记/文章】（${notes.length}篇）\n`;
        notes.forEach((link, index) => {
            content += `${index + 1}. ${link.trim()}\n`;
        });
        content += `\n`;
    }

    // SEO优化关键词
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🔍 SEO关键词优化\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    const keywords = [
        '民宿推荐',
        `${formData.location}民宿`,
        '特色民宿',
        hostels[0],
        '度假住宿',
        '精品民宿',
        '网红民宿',
        '周边游',
        '民宿预订',
        '民宿体验'
    ];
    content += keywords.join(' | ') + '\n\n';

    // AI平台问答优化
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `🤖 AI平台问答优化\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // 问答1
    content += `Q1: ${formData.location}有哪些值得推荐的民宿？\n`;
    content += `A: 强烈推荐${hostels.join('和')}！${formData.description.substring(0, 100)}`;
    if (formData.description.length > 100) content += '...';
    if (formData.price) content += ` 价格${formData.price}。`;
    content += ` 联系方式：${formData.contact}\n\n`;
    
    // 问答2
    content += `Q2: 国内哪些民宿好？\n`;
    content += `A: 位于${formData.location}的${hostels[0]}是一个不错的选择。`;
    content += `${formData.description.substring(0, 80)}`;
    if (formData.description.length > 80) content += '...';
    content += `\n\n`;
    
    // 问答3
    content += `Q3: ${hostels[0]}怎么样？\n`;
    content += `A: ${hostels[0]}位于${formData.location}，${formData.description.substring(0, 100)}`;
    if (formData.description.length > 100) content += '...';
    content += `\n\n`;

    // 推广建议
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    content += `💡 推广建议\n`;
    content += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    content += `1. 定期更新民宿照片和视频，保持内容新鲜度\n`;
    content += `2. 在小红书、抖音等平台持续发布优质内容\n`;
    content += `3. 鼓励客人在各平台留下真实好评\n`;
    content += `4. 每月重新提交一次以保持AI平台索引活跃\n`;
    content += `5. 关注节假日和旅游旺季，及时更新价格和可预订信息\n\n`;

    return content;
}

// 预览功能
previewBtn.addEventListener('click', () => {
    const formData = getFormData();
    if (!validateForm(formData)) {
        alert('请填写所有必填项！');
        return;
    }

    const content = generatePromotionContent(formData);
    document.getElementById('previewContent').textContent = content;
    previewModal.style.display = 'block';
});

// 关闭预览模态框
closePreviewBtn.addEventListener('click', () => {
    previewModal.style.display = 'none';
});

// 通用：所有 .close 按钮，关闭其所在 modal；点 modal 背景也关闭
document.querySelectorAll('.modal .close').forEach((el) => {
    el.addEventListener('click', () => {
        const modal = el.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

window.addEventListener('click', (event) => {
    document.querySelectorAll('.modal').forEach((m) => {
        if (event.target === m) m.style.display = 'none';
    });
});

// ESC 关所有 modal
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal').forEach((m) => (m.style.display = 'none'));
    }
});

// 获取表单数据
function getFormData() {
    const platforms = Array.from(document.querySelectorAll('input[name="platform"]:checked'))
        .map(cb => cb.value);
    const socials = Array.from(document.querySelectorAll('input[name="social"]:checked'))
        .map(cb => cb.value);

    return {
        hostelName1: document.getElementById('hostelName1').value.trim(),
        hostelName2: document.getElementById('hostelName2').value.trim(),
        location: document.getElementById('location').value.trim(),
        description: document.getElementById('description').value.trim(),
        contact: document.getElementById('contact').value.trim(),
        price: document.getElementById('price').value.trim(),
        videoLinks: document.getElementById('videoLinks').value.trim(),
        imageLinks: document.getElementById('imageLinks').value.trim(),
        noteLinks: document.getElementById('noteLinks').value.trim(),
        platforms: platforms,
        socials: socials
    };
}

// 验证表单
function validateForm(formData) {
    return formData.hostelName1 && 
           formData.location && 
           formData.description && 
           formData.contact &&
           (formData.platforms.length > 0 || formData.socials.length > 0);
}

// =============================================================
// 模块 A：localStorage 草稿保存 / 恢复
// =============================================================

function safeRead(key) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

function safeWrite(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (_) { /* 配额满或隐私模式，忽略 */ }
}

// 把对象写回表单
function setFormData(data) {
    if (!data) return;
    const fields = ['hostelName1', 'hostelName2', 'location', 'description', 'contact', 'price', 'videoLinks', 'imageLinks', 'noteLinks'];
    fields.forEach((id) => {
        const el = document.getElementById(id);
        if (el && typeof data[id] === 'string') el.value = data[id];
    });
    if (Array.isArray(data.platforms)) {
        document.querySelectorAll('input[name="platform"]').forEach((cb) => {
            cb.checked = data.platforms.includes(cb.value);
        });
    }
    if (Array.isArray(data.socials)) {
        document.querySelectorAll('input[name="social"]').forEach((cb) => {
            cb.checked = data.socials.includes(cb.value);
        });
    }
}

let draftSaveTimer = null;
function scheduleDraftSave() {
    clearTimeout(draftSaveTimer);
    draftSaveTimer = setTimeout(() => {
        const data = getFormData();
        // 只在有任何值时才保存，避免空草稿
        if (data.hostelName1 || data.location || data.description || data.contact) {
            // 1. 保留旧 LS_DRAFT 兼容（其他组件可能还在用）
            safeWrite(LS_DRAFT, data);
            // 2. 同步到 active profile
            try { persistFormToActiveProfile(); } catch (_) {}
        }
    }, 400);
}

function loadDraftIntoForm() {
    // 优先从 active profile 加载（新数据通道）
    try {
        const active = getActiveProfile();
        if (active && active.data && (active.data.hostelName1 || active.data.location || active.data.description)) {
            setFormData(active.data);
            if (draftTip) draftTip.style.display = 'block';
            return true;
        }
    } catch (_) {}
    // 回退到老 LS_DRAFT
    const draft = safeRead(LS_DRAFT);
    if (!draft) return false;
    setFormData(draft);
    if (draftTip) draftTip.style.display = 'block';
    return true;
}

function clearDraft() {
    try { localStorage.removeItem(LS_DRAFT); } catch (_) {}
    // 同时清空 active profile 内容（但保留档案本身）
    try {
        const store = ensureProfileStore();
        const active = store.profiles.find((x) => x.id === store.activeId);
        if (active) {
            active.data = {};
            active.updatedAt = Date.now();
            saveProfileStore(store);
        }
    } catch (_) {}
    if (draftTip) draftTip.style.display = 'none';
}

// 监听表单变化：自动存草稿
form.addEventListener('input', scheduleDraftSave);
form.addEventListener('change', scheduleDraftSave);
if (clearDraftBtn) {
    clearDraftBtn.addEventListener('click', () => {
        if (!confirm('清除已保存的表单草稿？当前页面填写的内容不会被清除。')) return;
        clearDraft();
    });
}

// =============================================================
// 模块 A：二维码生成（基于全局 qrcode-generator）
// =============================================================

function renderQrInto(container, text) {
    if (!container) return;
    container.innerHTML = '';
    if (typeof qrcode !== 'function') {
        // 库未加载：降级文本
        const fb = document.createElement('div');
        fb.className = 'qr-fallback';
        fb.textContent = '二维码加载失败，请直接点右侧"打开官方入口"按钮。';
        container.appendChild(fb);
        return;
    }
    try {
        // typeNumber=0 自动；纠错 'M'
        const qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        // cellSize=4, margin=2
        container.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
        const svg = container.querySelector('svg');
        if (svg) {
            svg.setAttribute('width', '110');
            svg.setAttribute('height', '110');
        }
    } catch (err) {
        container.textContent = '二维码生成失败';
    }
}

// =============================================================
// 模块 B：提交记录台账（localStorage + CSV 导出）
// =============================================================

const STATUS_LABELS = {
    submitted: '已提交',
    approved: '已通过',
    rejected: '被拒绝',
    no_reply: '无回复'
};

function loadRecords() {
    const r = safeRead(LS_RECORDS);
    return Array.isArray(r) ? r : [];
}

function saveRecords(list) {
    safeWrite(LS_RECORDS, list);
    updateRecordsBadge();
}

function updateRecordsBadge() {
    if (recordsCountEl) {
        const n = loadRecords().length;
        recordsCountEl.textContent = n;
        recordsCountEl.style.display = n > 0 ? 'inline-flex' : 'none';
    }
}

function addRecord(formData, platformId) {
    const records = loadRecords();
    const platform = AI_PLATFORMS[platformId];
    records.unshift({
        id: 'r_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
        date: new Date().toISOString(),
        hostelName: formData.hostelName1 || '',
        location: formData.location || '',
        platformId,
        platformName: platform ? platform.name : platformId,
        status: 'submitted',
        note: ''
    });
    saveRecords(records);
}

function updateRecord(id, patch) {
    const records = loadRecords();
    const i = records.findIndex((r) => r.id === id);
    if (i === -1) return;
    records[i] = { ...records[i], ...patch };
    saveRecords(records);
}

function deleteRecord(id) {
    const records = loadRecords().filter((r) => r.id !== id);
    saveRecords(records);
    renderRecordsTable();
}

function clearAllRecords() {
    saveRecords([]);
    renderRecordsTable();
}

// 是否已为当前民宿+平台标记过提交
function hasRecord(formData, platformId) {
    return loadRecords().some(
        (r) => r.platformId === platformId && r.hostelName === (formData.hostelName1 || '')
    );
}

function fmtDate(iso) {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        const pad = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch (_) {
        return iso;
    }
}

function renderRecordsTable() {
    if (!recordsTbody) return;
    const records = loadRecords();
    if (records.length === 0) {
        recordsTbody.innerHTML = '<tr><td colspan="6" class="records-empty">暂无记录</td></tr>';
        return;
    }
    recordsTbody.innerHTML = '';
    records.forEach((r) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${escapeHtml(fmtDate(r.date))}</td>
            <td>${escapeHtml(r.hostelName)}<br><small>${escapeHtml(r.location)}</small></td>
            <td>${escapeHtml(r.platformName)}</td>
            <td>
                <select class="record-status" data-id="${escapeHtml(r.id)}">
                    ${Object.entries(STATUS_LABELS).map(([k, v]) =>
                        `<option value="${k}"${k === r.status ? ' selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
            </td>
            <td><input type="text" class="record-note" data-id="${escapeHtml(r.id)}" value="${escapeHtml(r.note || '')}" placeholder="平台回复 / 备注"></td>
            <td><button type="button" class="btn-link record-delete" data-id="${escapeHtml(r.id)}">删除</button></td>
        `;
        recordsTbody.appendChild(tr);
    });
}

// 事件委托：状态/备注/删除
if (recordsTbody) {
    recordsTbody.addEventListener('change', (e) => {
        const t = e.target;
        if (t.classList.contains('record-status')) {
            updateRecord(t.dataset.id, { status: t.value });
        }
    });
    recordsTbody.addEventListener('input', (e) => {
        const t = e.target;
        if (t.classList.contains('record-note')) {
            updateRecord(t.dataset.id, { note: t.value });
        }
    });
    recordsTbody.addEventListener('click', (e) => {
        const t = e.target;
        if (t.classList.contains('record-delete')) {
            if (confirm('确定删除这条记录吗？')) deleteRecord(t.dataset.id);
        }
    });
}

if (recordsBtn) {
    recordsBtn.addEventListener('click', () => {
        renderRecordsTable();
        if (recordsModal) recordsModal.style.display = 'block';
    });
}

if (clearRecordsBtn) {
    clearRecordsBtn.addEventListener('click', () => {
        if (!confirm('清空所有提交记录？这个操作不可恢复。')) return;
        clearAllRecords();
    });
}

// CSV 导出
function exportRecordsCsv() {
    const records = loadRecords();
    if (records.length === 0) {
        alert('暂无记录可导出。');
        return;
    }
    const headers = ['提交日期', '民宿名称', '位置', '平台', '状态', '备注'];
    const rows = records.map((r) => [
        fmtDate(r.date),
        r.hostelName,
        r.location,
        r.platformName,
        STATUS_LABELS[r.status] || r.status,
        r.note || ''
    ]);
    const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(','))
        .join('\r\n');
    // BOM 让 Excel 正确识别 UTF-8
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `民宿AI平台提交记录_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function csvCell(v) {
    const s = String(v == null ? '' : v);
    if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
}

if (exportCsvBtn) exportCsvBtn.addEventListener('click', exportRecordsCsv);

// =============================================================
// 模块 C：社交平台爆文文案生成（小红书 / 抖音 / 公众号）
// =============================================================

function pickHashtags(formData) {
    const loc = formData.location || '';
    const tags = [
        loc + '民宿',
        loc + '旅游',
        formData.hostelName1,
        '民宿推荐',
        '小众民宿',
        '特色民宿',
        '出片民宿',
        '周末去哪儿',
        '旅行打卡'
    ].filter(Boolean);
    return [...new Set(tags)].slice(0, 8);
}

// =============================================================
// 小红书 4 个版本（沉浸式种草 / 避雷盘点 / KOL 测评 / 治愈日记）
// =============================================================

function generateXhsImmersive(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 80);
    const price = formData.price ? ` 💰 ${formData.price}\n` : '';
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `🌿这家${loc}的宝藏民宿，绝了！`,
        '',
        `🏡 |${name}|`,
        `📍 ${loc}`,
        price + `✨ ${desc}`,
        '',
        '👇这次入住的真实体验：',
        '1️⃣ 一进门就被氛围感拿捏住了',
        '2️⃣ 房间细节满分，自然光超好出片',
        '3️⃣ 老板真诚靠谱，行程都帮安排',
        '',
        '💭 想了解的姐妹直接评论区告诉我，或看我主页置顶哦 ❤️',
        '',
        tags
    ].join('\n');
}

function generateXhsAvoidancePick(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 60);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `‼️${loc}民宿避雷｜住过 5 家终于找到本命`,
        '',
        `刷小红书攻略快被搞晕了，订之前真的要看清楚再下手 🥲`,
        '',
        '🚫 这些雷我替你踩过了：',
        '· 离市区 1h+ 但宣传"市中心"的，pass',
        '· 图片滤镜超重、实际灰扑扑的，pass',
        '· 老板 24h 不回消息的，pass',
        '· 隔音差、楼上脚步声不绝于耳的，pass',
        '',
        `✅ 最后留下这家：${name}`,
        `📍 ${loc}`,
        `💎 我为什么留下：${desc}`,
        '',
        '· 真实图≈实际，零滤镜也好看',
        '· 老板 3 分钟回消息，问什么答什么',
        '· 床品干净到能闻到太阳味',
        '· 房间隔音好到我以为只有我一个客人',
        '',
        '👀 想看更多对比图，评论区扣"对比"我整理一份给你',
        '💌 主页置顶有所有住过的清单',
        '',
        tags
    ].join('\n');
}

function generateXhsKolReview(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 80);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');
    const price = formData.price ? `💰 价格：${formData.price}` : '';

    return [
        `📊《${loc}民宿测评 vol.${Math.floor(Math.random() * 30) + 5}》`,
        '',
        `本期主角｜${name}`,
        '',
        `🏷 类型：独栋小院 / 设计感民宿（请据实标注）`,
        `📍 位置：${loc}`,
        price,
        '',
        '────── 测评打分 ──────',
        '🛏 床品舒适度  ⭐⭐⭐⭐⭐',
        '🚿 卫浴干净度  ⭐⭐⭐⭐⭐',
        '🌅 出片指数    ⭐⭐⭐⭐⭐',
        '🍳 早餐用心度  ⭐⭐⭐⭐☆',
        '🤝 服务响应速度 ⭐⭐⭐⭐⭐',
        '💰 性价比      ⭐⭐⭐⭐⭐',
        '────────────────',
        '',
        `🎯 一句话总结：${desc}`,
        '',
        '💡 适合谁来：',
        '✓ 想拍一组治愈系大片的姐妹',
        '✓ 周末想短途遛娃的家庭',
        '✓ 工作日逃离城市的打工人',
        '',
        '👻 不适合：',
        '✗ 期望豪华酒店式服务的（这是民宿不是连锁酒店）',
        '✗ 强迫症（民宿都有手作感的小细节）',
        '',
        '❤️ 跟我一起吃住玩｜评论区扣"民宿"我整理本月推荐',
        '',
        tags
    ].filter(Boolean).join('\n');
}

function generateXhsHealingDiary(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 100);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `🌧 在${loc}的${name}，住了 2 天，治好了我的精神内耗`,
        '',
        '上周加班到崩溃，朋友拉着我跑来住了 2 晚',
        '回到城里第一件事，就是写下这篇笔记',
        '',
        `💭 ${desc}`,
        '',
        '📔 day 1',
        '· 下午到达，老板递了一杯当地茶',
        '· 在院子里发了 2 小时呆，看云慢慢飘',
        '· 晚上没开手机，听虫鸣',
        '',
        '📔 day 2',
        '· 6:30 自然醒（在城里我睡到 11 点都起不来）',
        '· 早餐是热腾腾的本地早点',
        '· 上午看了一本书，下午被老板带去逛了周边小路',
        '',
        '📌 离开前老板说："下次想来，提前打个招呼就行"',
        '🥺 那一刻我突然眼眶有点酸',
        '',
        '🤍 谢谢这个小院让我喘了一口气',
        '🤍 把它写在这里，希望下一个累坏的姐妹也能找到',
        '',
        '✉️ 想问怎么订的，评论区戳我，或主页置顶',
        '',
        tags
    ].join('\n');
}

// 默认主入口（保留原名以防调用），指向 V1
function generateXiaohongshuPost(formData) {
    return generateXhsImmersive(formData);
}

// =============================================================
// 抖音 3 个版本（15s 钩子 / 30s 体验 / 60s 故事）
// =============================================================

function generateDouyinScript15(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, '；').slice(0, 60);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `【 15s 钩子版 · 适合首次破圈 】`,
        ``,
        `📐 分镜：`,
        `0–3s（爆点）：藏在${loc}的这家民宿，我不允许还有人不知道！`,
        `3–10s（画面）：3 个最出片的房间细节快切 + bgm 燃起来`,
        `10–15s（CTA）：${name}，定位置顶评论，主页见预订方式`,
        ``,
        `📝 完整口播：`,
        `${desc}`,
        ``,
        `🎵 BGM 推荐：抖音热门旅行类卡点曲（在抖音搜"民宿BGM"取一个最近 7 天爆的）`,
        `📌 字幕要点：每 1.5 秒一句，关键词加粗（用色块）`,
        ``,
        `🏷 话题：${tags}`,
        ``,
        `💡 抖音风控提醒：评论区禁放电话/微信，引导到主页店铺即可`
    ].join('\n');
}

function generateDouyinScript30(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, '；').slice(0, 80);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `【 30s 体验版 · 适合主推沉浸感 】`,
        ``,
        `📐 分镜：`,
        `0–5s：开场—被这家${loc}民宿震撼到了`,
        `5–15s：3 个最绝的细节（环境/房间/早餐）`,
        `15–25s：店主真诚 + 接送 / 周边活动`,
        `25–30s：CTA—"评论区扣 1 我发定位"`,
        ``,
        `📝 口播稿：`,
        `${desc}。我已经准备好二刷了。`,
        ``,
        `🎬 拍摄建议：`,
        `· 第一镜要稳，不要用滤镜，原片更显高级`,
        `· 至少 1 个 vlog 第一视角推门镜头`,
        `· 早餐镜头要有水汽 / 蒸气，激发食欲`,
        ``,
        `🏷 话题：${tags}`,
        ``,
        `💡 抖音风控提醒：联系方式只放主页"店铺"或"个性签名"`
    ].join('\n');
}

function generateDouyinScript60(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, '；').slice(0, 100);
    const tags = pickHashtags(formData).map(t => `#${t}`).join(' ');

    return [
        `【 60s 故事版 · 适合冲爆款 】`,
        ``,
        `📐 分镜：`,
        `0–10s：今天带大家逃离城市，目的地是${loc}`,
        `10–25s：到达${name}，外观 / Check-in / 院子`,
        `25–45s：房间 / 早餐 / 周边玩法`,
        `45–55s：和店主聊天，了解民宿故事（这段最容易转赞）`,
        `55–60s：总结 + CTA（请记得在主页简介里写预订方式）`,
        ``,
        `📝 口播稿：`,
        `${desc}`,
        ``,
        `🎬 故事节奏建议：`,
        `· 0–25s 用快剪，制造视觉冲击`,
        `· 25–55s 慢下来讲故事，让用户共情`,
        `· 最后 5s 一定要留 CTA，引导主页`,
        ``,
        `💡 抹去聊联系方式，在抖音主页「店铺」或「个性签名」里引导。评论区不要直接放号。`,
        `🏷 话题：${tags}`
    ].join('\n');
}

// 默认主入口（保留原名）
function generateDouyinScript(formData) {
    return generateDouyinScript30(formData);
}

// =============================================================
// 大众点评 2 个版本（标准商户简介 / 卖点导向版）
// =============================================================

function generateDianpingIntro(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 120);

    // 大众点评是商户端，允许放真实电话/地址；重点是结构化 + 关键词利于搜索
    return [
        `【商户信息】${name}`,
        `━━━━━━━━━━━━━━━━`,
        ``,
        `📍 地址：${loc}`,
        `☎ 电话：${formData.contact}`,
        formData.price ? `💰 人均：${formData.price}` : '',
        `🕐 营业时间：全天（24 小时 Check-in 请提前预约）`,
        ``,
        `🏡 店铺介绍`,
        desc,
        ``,
        `🌟 推荐理由（请据实选用）`,
        `· 干净卫生、一客一换`,
        `· 环境安静、适合出片`,
        `· 老板靠谱、行程可咨询`,
        `· 提供本地特色早餐`,
        `· 周边景点一站式可达`,
        ``,
        `👥 适合：家庭亲子 / 情侣出游 / 朋友小聚 / 短途度假`,
        ``,
        `🔍 点评搜索词建议（写入商户标签）`,
        `${loc}民宿、${loc}住宿、${loc}短租、${name}、${loc}周边民宿`,
        ``,
        `━━━━━━━━━━━━━━━━`,
        `💡 发布后请完善：营业执照 / 民宿经营许可证 / 真实门头照 / 至少 10 张房间图`,
        `💡 早期拜托 5-10 位老客户真实点评，比任何文案都管用`
    ].filter(Boolean).join('\n');
}

function generateCtripListing(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 100);

    return [
        `【房源标题】`,
        `${name}｜${loc}｜（建议加 1 个核心卖点，如"一线湖景"、"古镇中心"、"带院子"）`,
        ``,
        `【房源描述】`,
        `━━━━━━━━━━━━━━━━━━`,
        ``,
        `▎房源位置`,
        `${loc}`,
        `（建议补充：距离最近的高铁站 X 公里、地铁站 X 号线 XX 站、机场 X 公里）`,
        ``,
        `▎房源亮点`,
        desc,
        ``,
        `▎房型与价格`,
        formData.price ? `参考价格：${formData.price}` : `参考价格：（请填写旺季/淡季区间）`,
        `（请据实勾选房型数量与床型）`,
        `□ 大床房 × __`,
        `□ 双床房 × __`,
        `□ 家庭房 × __`,
        `□ 榻榻米 × __`,
        ``,
        `▎设施清单（请据实勾选）`,
        `□ 独立卫浴    □ 空调      □ 免费 WiFi`,
        `□ 24 小时热水 □ 吹风机    □ 洗漱用品`,
        `□ 智能电视    □ 停车位    □ 厨房`,
        `□ 阳台 / 院子 □ 棋牌桌    □ 烧烤设备`,
        ``,
        `▎特色服务`,
        `· 本地特色早餐（可选，详情见描述）`,
        `· 接送服务（视距离收费）`,
        `· 周边景点行程咨询`,
        `· 管家 24h 响应`,
        ``,
        `▎周边推荐`,
        `（请填写 3-5 个最近的景点/餐厅/交通站点，携程会据此匹配旅游搜索）`,
        ``,
        `▎入住须知`,
        `· 入住时间：14:00 后  退房时间：12:00 前`,
        `· 接受支付方式：在线付 / 到店付（据实）`,
        `· 房源禁止：吸烟 / 喧哗 / 饲养宠物（请据实调整）`,
        ``,
        `▎联系我们`,
        `电话：${formData.contact}`,
        `━━━━━━━━━━━━━━━━━━`,
        ``,
        `💡 携程房源 SEO 小贴士`,
        `1. 标题必须含"${loc}"与核心卖点，排名权重最高`,
        `2. 前 3 张图决定点击率：建议顺序 = 外观 / 院子 / 房间`,
        `3. 开通"闪住"标签能拿到更多曝光`,
        `4. 早期价格略低 5-10%，累计 20 条 5 星评价后再调整`
    ].filter(Boolean).join('\n');
}

// =============================================================
// 大众点评 V2：卖点导向版（更适合搜索结果页吸引点击）
// =============================================================
function generateDianpingHighlights(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 100);

    return [
        `🏡 ${name}｜${loc}的小院民宿`,
        ``,
        `━━━ 五大卖点速览 ━━━`,
        `① 出片好看：每个角落都自带滤镜（建议放院子+房间内景图）`,
        `② 干净到尖叫：床品酒店级别，一客一换`,
        `③ 早餐惊喜：本地手作（请按实际填写）`,
        `④ 老板靠谱：3 分钟回消息，行程随时帮安排`,
        `⑤ 周边好玩：${loc} 主要景点车程内可达`,
        ``,
        `━━━ 详细介绍 ━━━`,
        desc,
        ``,
        `━━━ 实用信息 ━━━`,
        `📍 ${loc}`,
        `☎ ${formData.contact}`,
        formData.price ? `💰 人均：${formData.price}` : '💰 人均：（请填写）',
        `🕐 全天营业，提前 1 天预订`,
        ``,
        `━━━ 推荐人群 ━━━`,
        `👨‍👩‍👧 亲子家庭｜🤍 情侣度假｜👯 闺蜜出游｜🎒 文艺独行`,
        ``,
        `🔍 关键词：${loc}民宿、${name}、${loc}小院、${loc}短租`,
        ``,
        `💡 想问问题，欢迎电话直拨或评论留言。期待你的到来 🌿`
    ].filter(Boolean).join('\n');
}

// =============================================================
// 携程 V2：用户视角的体验描述（替代官方填空式）
// =============================================================
function generateCtripExperience(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = (formData.description || '').replace(/\n+/g, ' ').slice(0, 120);
    const price = formData.price ? `参考价位：${formData.price}` : '参考价位：（请填写）';

    return [
        `【${name} · 房源故事版】`,
        ``,
        `———— 一句话先告诉你 ————`,
        `这是位于${loc}的一家小院民宿，更像是去朋友家做客。`,
        ``,
        `———— 推开门是怎样的体验 ————`,
        desc,
        ``,
        `———— 你会爱上这里的 5 个理由 ————`,
        `1. 房间不大，但每一寸都能看出主人有花心思`,
        `2. 床品是酒店级别，自带太阳味`,
        `3. 早餐有本地特色（具体见菜单）`,
        `4. 院子是发呆神器，wifi 和空调全配齐`,
        `5. 出门即可达${loc}主要景点`,
        ``,
        `———— 适合谁 ————`,
        `· 想拍组好看照片的情侣`,
        `· 想带娃逃离城市的家庭`,
        `· 工作累了想喘口气的人`,
        ``,
        `———— 不适合谁 ————`,
        `· 期待 5 星酒店服务规格的客人（这里更生活感）`,
        `· 半夜要嗨到 3 点的（隔音再好也会扰邻）`,
        ``,
        `———— 实用信息 ————`,
        `📍 ${loc}`,
        `💰 ${price}`,
        `📞 联系：${formData.contact}（携程站内消息也可）`,
        `🕐 入住 14:00 起  退房 12:00 前`,
        ``,
        `💡 携程"客人故事"模块是 OTA 排名加分项，建议把这版填进去`
    ].filter(Boolean).join('\n');
}

function generateWechatArticle(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const price = formData.price ? `\n人均：${formData.price}\n` : '';
    return [
        `# 我在${loc}找到了一家不想告诉你的民宿｜${name}`,
        ``,
        `## 一、这家民宿凭什么打动我`,
        formData.description,
        ``,
        `## 二、走进${name}`,
        `位置：${loc}`,
        price,
        `推荐理由：氛围、出片、老板靠谱、性价比高`,
        ``,
        `## 三、最值得体验的 3 件小事`,
        `1. ……（建议根据真实体验补充）`,
        `2. ……`,
        `3. ……`,
        ``,
        `## 四、实用信息`,
        `- 联系方式：${formData.contact}`,
        formData.videoLinks ? `- 视频探店：${formData.videoLinks.split('\n')[0]}` : '',
        formData.noteLinks ? `- 相关笔记：${formData.noteLinks.split('\n')[0]}` : '',
        ``,
        `> 写在最后：旅行的意义之一，是被一家民宿温柔接住。`
    ].filter(Boolean).join('\n');
}

// =============================================================
// 公众号 V2：${loc} 攻略型长文（用户搜索"${loc}怎么玩"会看到）
// =============================================================
function generateWechatGuide(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = formData.description || '';
    return [
        `# ${loc} 周末游攻略｜从交通、住宿到 5 个必去景点全打包`,
        ``,
        `本周末打算去${loc}的朋友看过来，这篇攻略我整理了 1 周，含住宿/景点/交通/吃喝四块。文末有省心住宿推荐。`,
        ``,
        `## 一、${loc} 一句话简介`,
        `${loc}的核心标签：（请补充 3 个，如"古镇/山景/温泉"）。建议停留时长：1.5–2 天。`,
        ``,
        `## 二、5 个必去`,
        `1. ……`,
        `2. ……`,
        `3. ……`,
        `4. ……`,
        `5. ……`,
        ``,
        `## 三、交通指南`,
        `· 高铁：（最近高铁站 → 民宿距离 / 出租车价 / 接送方式）`,
        `· 自驾：（建议路线 + 停车说明）`,
        `· 公交：（最末班车时间，避免被困）`,
        ``,
        `## 四、吃什么`,
        `· 必尝 3 道本地菜：……`,
        `· 私藏小馆子：……（不在大众点评热门榜的）`,
        ``,
        `## 五、住哪里`,
        `经过 5 家比较，我个人推荐 ${name}：`,
        ``,
        `> ${desc}`,
        ``,
        `**为什么是它**：`,
        `- 离主要景点车程合适（不太远也不太热闹）`,
        `- 老板对周边攻略熟悉，可帮规划`,
        `- 性价比与设施综合最好`,
        ``,
        `📞 ${formData.contact}`,
        ``,
        `## 六、避坑提醒`,
        `· 节假日订房务必提前 7 天`,
        `· ${loc}天气变化快，带件外套`,
        `· 部分景点周一闭馆，请确认`,
        ``,
        `> 用心写的攻略，看完点个"在看"再走 🌿`
    ].filter(Boolean).join('\n');
}

// =============================================================
// 公众号 V3：店主自述/采访体（适合品牌故事栏目）
// =============================================================
function generateWechatInterview(formData) {
    const name = formData.hostelName1;
    const loc = formData.location;
    const desc = formData.description || '';
    return [
        `# 对话｜${loc}${name} 主理人：开一家民宿，到底图什么`,
        ``,
        `> 一篇关于"为什么开民宿"的采访。`,
        `> 受访｜${name} 主理人  地点｜${loc}`,
        ``,
        `**Q：先做个简单介绍。**`,
        `A：${desc}`,
        ``,
        `**Q：开这家民宿之前你在做什么？**`,
        `A：（请补充：之前的职业 / 城市 / 转折点）`,
        ``,
        `**Q：选择${loc}的原因？**`,
        `A：（请补充：是不是回乡 / 是不是被这片土地打动 / 朋友推荐等）`,
        ``,
        `**Q：${name}最特别的地方是什么？**`,
        `A：（请补充 3 点，如建筑保留 / 食材本地 / 早餐手作 等）`,
        ``,
        `**Q：开业到现在，最难忘的客人故事？**`,
        `A：（请补充：1 个具体客人、具体场景。这部分最容易触动读者）`,
        ``,
        `**Q：对来这里的客人，你想说什么？**`,
        `A：（请补充：希望客人怎样对待这个空间 / 期待什么样的相处）`,
        ``,
        `---`,
        ``,
        `📍 ${loc}`,
        `📞 ${formData.contact}`,
        formData.videoLinks ? `🎬 视频：${formData.videoLinks.split('\n')[0]}` : '',
        ``,
        `> 如果这篇文字让你有想去看看的冲动，欢迎留言或后台私信我们。`
    ].filter(Boolean).join('\n');
}

// SOCIAL_TEMPLATES：每个平台多个版本（versions），点"🔄 换一版"循环切换
const SOCIAL_TEMPLATES = [
    {
        id: 'xhs',
        name: '小红书种草笔记',
        emoji: '📕',
        publishUrl: 'https://creator.xiaohongshu.com/publish/publish',
        publishLabel: '去小红书创作中心',
        tip: '小红书内容会被阿里千问、豆包大量抓取，对国内 AI 影响最大',
        versions: [
            { name: '沉浸式种草', gen: generateXhsImmersive },
            { name: '避雷盘点文', gen: generateXhsAvoidancePick },
            { name: 'KOL 测评', gen: generateXhsKolReview },
            { name: '治愈日记', gen: generateXhsHealingDiary }
        ]
    },
    {
        id: 'dy',
        name: '抖音口播脚本',
        emoji: '🎵',
        publishUrl: 'https://creator.douyin.com/',
        publishLabel: '去抖音创作服务平台',
        tip: '抖音/头条系是豆包训练数据主要来源，发到这里 AI "认识"你最快',
        versions: [
            { name: '15s 钩子版', gen: generateDouyinScript15 },
            { name: '30s 体验版', gen: generateDouyinScript30 },
            { name: '60s 故事版', gen: generateDouyinScript60 }
        ]
    },
    {
        id: 'wx',
        name: '公众号长文',
        emoji: '📰',
        publishUrl: 'https://mp.weixin.qq.com/',
        publishLabel: '去公众号后台',
        tip: '微信公众号被腾讯元宝、搜狗搜索、Google 大量索引',
        versions: [
            { name: '主理人故事', gen: generateWechatArticle },
            { name: '城市攻略型', gen: generateWechatGuide },
            { name: '采访对话体', gen: generateWechatInterview }
        ]
    },
    {
        id: 'dzdp',
        name: '大众点评商户简介',
        emoji: '🗺️',
        publishUrl: 'https://e.dianping.com/',
        publishLabel: '去大众点评商户后台',
        tip: '大众点评 / 美团系是阿里千问、豆包高频引用的本地生活数据源，有商户认证 AI 会优先推荐',
        versions: [
            { name: '标准商户简介', gen: generateDianpingIntro },
            { name: '卖点速览版', gen: generateDianpingHighlights }
        ]
    },
    {
        id: 'ctrip',
        name: '携程房源描述',
        emoji: '✈️',
        publishUrl: 'https://ebooking.ctrip.com/',
        publishLabel: '去携程商家后台',
        tip: '携程是国内 OTA 最大内容池，旅游类问题 AI 经常引用携程点评/房源',
        versions: [
            { name: 'OTA 标准房源', gen: generateCtripListing },
            { name: '客人故事版', gen: generateCtripExperience }
        ]
    }
];

// =============================================================
// 模块 C+：平台违禁内容审查（自动移除手机号/微信号/引流话术/绝对化用词）
// =============================================================

// 公共规则集合（被多个平台引用）
const RULE_PHONE = {
    regex: /(?<!\d)(?:\+?86[-\s]?)?1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}(?!\d)/g,
    replace: '（联系方式见主页）',
    desc: '手机号',
    sev: 'high'
};
const RULE_WECHAT_ID = {
    // 显式带前缀的微信号：微信/wx/wechat/v信/威信/V 后跟 ID（5-20 位字母数字下划线/-）
    regex: /(?:微信号?|wechat|wx|v\s*信|威信|VX)[\s::号]*[a-zA-Z][a-zA-Z0-9_\-]{4,19}\b/gi,
    replace: '（私信我哦）',
    desc: '微信号',
    sev: 'high'
};
const RULE_QQ = {
    regex: /\b(?:qq|QQ)[\s::号]*\d{5,12}\b/g,
    replace: '（私信我哦）',
    desc: 'QQ 号',
    sev: 'mid'
};
const RULE_EMAIL = {
    regex: /\b[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}\b/g,
    replace: '（私信我哦）',
    desc: '邮箱',
    sev: 'mid'
};
const RULE_TRAFFIC_WORDS = {
    // 引流话术
    regex: /(加我(?:微信|VX|V|v信|威信|号)?|加\s*V(?![a-zA-Z])|加\s*微信|加\s*威信|D\s*我|滴我|扣我|私聊我|私我|来扫我|扫码加|长按加|主动联系|来撩我)/g,
    replace: '私信我',
    desc: '引流话术',
    sev: 'high'
};
const RULE_ABSOLUTE = {
    // 广告法禁止的绝对化用词
    regex: /(最佳|最便宜|最低价|最优惠|最美|最好|最棒|最强|第一名|顶级|国家级|世界级|绝对|百分之百|100\s*%|首选|独家|唯一|权威|王牌)/g,
    replace: '很棒',
    desc: '绝对化用词（广告法）',
    sev: 'mid'
};

// 平台 → 应用规则
const PLATFORM_RULES = {
    xhs: {
        name: '小红书',
        rules: [RULE_PHONE, RULE_WECHAT_ID, RULE_QQ, RULE_EMAIL, RULE_TRAFFIC_WORDS, RULE_ABSOLUTE]
    },
    dy: {
        name: '抖音',
        rules: [RULE_PHONE, RULE_WECHAT_ID, RULE_QQ, RULE_EMAIL, RULE_TRAFFIC_WORDS, RULE_ABSOLUTE]
    },
    wx: {
        // 微信公众号是民宿主自己的渠道，允许放联系方式；只禁绝对化用词
        name: '微信公众号',
        rules: [RULE_ABSOLUTE]
    },
    dzdp: {
        // 大众点评是商户端，允许（鼓励）填真实电话/地址；但仍禁微信号引流、绝对化、QQ/邮箱
        name: '大众点评',
        rules: [RULE_WECHAT_ID, RULE_QQ, RULE_EMAIL, RULE_TRAFFIC_WORDS, RULE_ABSOLUTE]
    },
    ctrip: {
        // 携程同理：酒店/民宿房源要求客观描述，允许留商户电话，但禁微信号引流、绝对化
        name: '携程',
        rules: [RULE_WECHAT_ID, RULE_QQ, RULE_EMAIL, RULE_TRAFFIC_WORDS, RULE_ABSOLUTE]
    }
};

// 净化文本：返回 { text: 净化后, hits: [{desc, count, samples, sev}] }
function sanitizeForPlatform(text, platformId) {
    const rule = PLATFORM_RULES[platformId];
    if (!rule) return { text, hits: [] };

    let result = text;
    const hits = [];
    rule.rules.forEach((r) => {
        const matches = result.match(r.regex);
        if (matches && matches.length > 0) {
            hits.push({
                desc: r.desc,
                sev: r.sev || 'mid',
                count: matches.length,
                samples: [...new Set(matches.map((m) => m.trim()))].slice(0, 3)
            });
            result = result.replace(r.regex, r.replace);
        }
    });
    return { text: result, hits };
}

// 把审查结果（hits 列表）渲染成头部盾牌横幅 HTML
function buildShieldBanner(template, hits) {
    const platName = escapeHtml(
        PLATFORM_RULES[template.id] ? PLATFORM_RULES[template.id].name : template.name
    );
    const totalHits = hits.reduce((s, h) => s + h.count, 0);
    const hasHigh = hits.some((h) => h.sev === 'high');

    if (hits.length === 0) {
        return `
            <div class="social-card-shield ok">
                🛡 已按 <strong>${platName}</strong> 平台规则自动检查 —
                <span class="ok-text">未发现违禁内容，可直接发布</span>
            </div>
        `;
    }

    const sev = hasHigh ? 'high' : 'mid';
    const sevLabel = hasHigh ? '已自动修复' : '提示';
    const detailsList = hits.map((h) => {
        const samples = h.samples.length
            ? `<small>检出：${h.samples.map((s) => `<code>${escapeHtml(s)}</code>`).join('、')}</small>`
            : '';
        return `<li class="sev-${h.sev}">
            <strong>${escapeHtml(h.desc)}</strong> × ${h.count}
            ${samples}
        </li>`;
    }).join('');

    return `
        <details class="social-card-shield ${sev}" open>
            <summary>
                🛡 ${sevLabel} <strong>${totalHits}</strong> 处可能违反 <strong>${platName}</strong> 规则的内容
                （已自动替换为安全表述）— 点击查看详情
            </summary>
            <ul class="shield-hits">${detailsList}</ul>
            <p class="shield-foot">💡 你之前在表单里填的电话/微信号已替换。如果一定要放联系方式，请在<strong>主页简介</strong>或<strong>个性签名</strong>中放，避免直接出现在正文。</p>
        </details>
    `;
}

function createSocialCard(template, formData) {
    // 兼容老结构：如果没有 versions 字段，把 gen 包成单元素 versions
    const versions = Array.isArray(template.versions) && template.versions.length > 0
        ? template.versions
        : [{ name: '默认版', gen: template.gen }];

    let versionIdx = 0;

    // 调用当前版本生成器并跑风控
    const compute = () => {
        const ver = versions[versionIdx];
        const raw = ver.gen(formData);
        return sanitizeForPlatform(raw, template.id);
    };

    let { text, hits } = compute();

    const card = document.createElement('div');
    card.className = 'social-card';
    card.innerHTML = `
        <div class="social-card-head">
            <div class="social-card-title">
                <span class="platform-card-emoji">${template.emoji}</span>
                <span>${escapeHtml(template.name)}</span>
            </div>
        </div>
        <p class="social-card-tip">💡 ${escapeHtml(template.tip)}</p>

        <div class="social-card-toolbar" role="group" aria-label="文案版本切换">
            <span class="toolbar-label">📝 文案版本</span>
            <button type="button" class="btn-tool btn-switch-version" title="点击循环切换不同写作风格">
                🔄 <span class="ver-name">${escapeHtml(versions[0].name)}</span>
                <span class="badge-mini ver-idx">1/${versions.length}</span>
            </button>
        </div>

        <div class="social-card-shield-wrap"></div>

        <pre class="platform-card-pre"></pre>
        <div class="platform-card-actions">
            <button type="button" class="btn-secondary btn-copy">📋 仅复制</button>
            <button type="button" class="btn-primary btn-copy-open" title="一步搞定：复制安全文案 + 自动打开发布页">
                🚀 ${escapeHtml(template.publishLabel.replace(/^去/, '复制并去'))} →
            </button>
        </div>
        <p class="social-card-howto">
            � 点 <strong>🚀 复制并去…</strong>：文案进剪贴板 + 发布页在新标签打开 → 拖图 + <code>Ctrl+V</code> 粘贴 → 发布
        </p>
    `;

    const preEl = card.querySelector('.platform-card-pre');
    const shieldWrap = card.querySelector('.social-card-shield-wrap');
    const verNameEl = card.querySelector('.ver-name');
    const verIdxEl = card.querySelector('.ver-idx');
    const switchBtn = card.querySelector('.btn-switch-version');
    const copyBtn = card.querySelector('.btn-copy');
    const copyOpenBtn = card.querySelector('.btn-copy-open');

    const refresh = () => {
        const r = compute();
        text = r.text;
        hits = r.hits;
        preEl.textContent = text;
        shieldWrap.innerHTML = buildShieldBanner(template, hits);
        verNameEl.textContent = versions[versionIdx].name;
        verIdxEl.textContent = `${versionIdx + 1}/${versions.length}`;
        // 闪一下，让用户看见切换发生
        preEl.classList.remove('flash');
        // eslint-disable-next-line no-unused-expressions
        void preEl.offsetWidth;
        preEl.classList.add('flash');
    };

    // 单版本时禁用切换按钮
    if (versions.length <= 1) {
        switchBtn.disabled = true;
        switchBtn.title = '本平台只有 1 个版本';
    } else {
        switchBtn.addEventListener('click', () => {
            versionIdx = (versionIdx + 1) % versions.length;
            refresh();
        });
    }

    // 复制按钮：使用最新文案（净化后）
    copyBtn.addEventListener('click', (ev) => {
        copyTextToClipboard(text, ev.currentTarget);
    });

    // 复制并跳转：文案进剪贴板 + 新标签打开发布页
    if (copyOpenBtn) {
        copyOpenBtn.addEventListener('click', (ev) => {
            copyAndOpen(text, template.publishUrl, ev.currentTarget, template.name);
        });
    }

    // 初始渲染
    refresh();

    return card;
}

// =============================================================
// 模块 D：小红书爆文「智能改写器」
//   · 双模式：
//     - 🌿 本地词库（免费、离线、规则化伪原创）
//     - 🤖 AI 改写（用户提供 API key，纯前端调 Jina Reader + LLM）
//   · 多次"再洗一版"都不一样
// =============================================================

// ----- AI 子模块：LLM 提供商配置 -----
// builtin = 站点预置共享 key,用户零配置即可用。
// 如果用户填了自己的 key,会优先用用户的(可选其他 provider)。
const BUILTIN_AI = {
    provider: 'builtin',
    apiKey: 'sk-xjlzds0424',
    endpoint: 'https://interialaiapi.xiaojiaixhs.com/v1/chat/completions',
    fallbackEndpoint: 'http://43.139.203.146:8050/v1/chat/completions',
    model: 'deepseek-chat'
};

const LLM_PROVIDERS = {
    builtin: {
        name: '🎁 内建 AI（免配置）',
        tag: '🎁 无需 key · 开箱即用',
        endpoint: BUILTIN_AI.endpoint,
        model: BUILTIN_AI.model,
        keyHint: '无需填写',
        signupUrl: '',
        desc: '本站预置的共享 AI 接口，DeepSeek 模型，无需注册、无需 API key，直接可用。如需更稳定/隐私可切换到下方自费选项。',
        noKey: true
    },
    glm: {
        name: '智谱 GLM-4-Flash',
        tag: '🟢 完全免费',
        endpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        model: 'glm-4-flash',
        keyHint: 'xxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxx',
        signupUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
        desc: '智谱清言团队出品，每天 1000 万 token 免费额度，无需付费充值'
    },
    deepseek: {
        name: 'DeepSeek',
        tag: '💸 ¥1/百万 token',
        endpoint: 'https://api.deepseek.com/v1/chat/completions',
        model: 'deepseek-chat',
        keyHint: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        signupUrl: 'https://platform.deepseek.com/api_keys',
        desc: '杭州深度求索团队，质量高且极便宜，新用户送 ¥10 额度'
    },
    moonshot: {
        name: 'Moonshot Kimi',
        tag: '💸 ¥12/百万 token',
        endpoint: 'https://api.moonshot.cn/v1/chat/completions',
        model: 'moonshot-v1-8k',
        keyHint: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        signupUrl: 'https://platform.moonshot.cn/console/api-keys',
        desc: '月之暗面 Kimi，长文本能力强，适合大段笔记'
    }
};

const AI_CONFIG_KEY = 'mssyt_ai_config_v1';

function loadAiConfig() {
    try {
        const raw = localStorage.getItem(AI_CONFIG_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed.provider) return null;
        // noKey provider(如 builtin)允许不存 key
        const p = LLM_PROVIDERS[parsed.provider];
        if (!parsed.apiKey && !(p && p.noKey)) return null;
        return parsed;
    } catch (_) { return null; }
}

function saveAiConfig(provider, apiKey) {
    localStorage.setItem(AI_CONFIG_KEY, JSON.stringify({ provider, apiKey, savedAt: Date.now() }));
}

// 获取"有效配置":用户配置 > 内建 builtin(零配置兜底)
// 任何想用 AI 的地方都应该用这个,而不是 loadAiConfig
function getEffectiveAiConfig() {
    const user = loadAiConfig();
    if (user && user.provider && (user.apiKey || (LLM_PROVIDERS[user.provider] && LLM_PROVIDERS[user.provider].noKey))) {
        return user;
    }
    return { provider: BUILTIN_AI.provider, apiKey: BUILTIN_AI.apiKey, isBuiltin: true };
}

// 用户是否真正"自定义"了 provider(用来在 UI 区分"内建 / 自配")
function hasUserAiConfig() {
    const user = loadAiConfig();
    return !!(user && user.provider && user.provider !== 'builtin' && user.apiKey);
}

function clearAiConfig() {
    localStorage.removeItem(AI_CONFIG_KEY);
}

// ----- AI 子模块：通过 Jina Reader 抓取 URL 内容 -----
//   · r.jina.ai 是 Jina AI 的免费公共 reader，把任何 URL → 干净 Markdown
//   · 跨域全开，浏览器可直接 fetch
//   · 失败时上层应回退到手动粘贴
async function fetchViaJina(url) {
    if (!url || !/^https?:\/\//.test(url)) {
        throw new Error('请粘贴有效的 http(s) 链接');
    }
    // r.jina.ai 接受任何 URL；用 GET 拿纯文本 markdown
    const jinaUrl = 'https://r.jina.ai/' + url;
    let resp;
    try {
        resp = await fetch(jinaUrl, {
            method: 'GET',
            headers: { 'Accept': 'text/plain', 'X-Return-Format': 'markdown' }
        });
    } catch (e) {
        throw new Error('网络请求失败：' + e.message);
    }
    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`Jina Reader 返回 ${resp.status}：${txt.slice(0, 120)}`);
    }
    const md = await resp.text();
    if (!md || md.length < 30) {
        throw new Error('抓取到的内容过短，可能链接被反爬；请改为手动粘贴正文');
    }
    return md;
}

// 从 markdown 中粗略抽取标题和正文
function extractTitleBody(markdown) {
    const lines = markdown.split('\n');
    let title = '';
    const bodyLines = [];

    for (const ln of lines) {
        // Jina 返回的 markdown 头部通常是 "Title: ..." "URL Source: ..." "Markdown Content:"
        if (!title) {
            const m = ln.match(/^Title:\s*(.+)$/i);
            if (m) { title = m[1].trim(); continue; }
        }
        if (/^(URL Source|Published Time|Markdown Content):/i.test(ln)) continue;
        // markdown 一级标题也算 title 候选
        if (!title) {
            const m = ln.match(/^#\s+(.+)$/);
            if (m) { title = m[1].trim(); continue; }
        }
        bodyLines.push(ln);
    }

    // 去掉 markdown 链接 + 图片标记，让正文更"干净"
    let body = bodyLines.join('\n')
        .replace(/!\[[^\]]*\]\([^)]+\)/g, '')        // 图片
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')     // 链接保留文字
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    // 砍到 1500 字以内（避免 token 超限）
    if (body.length > 1500) body = body.slice(0, 1500) + '…';

    return { title: title || '(无标题)', body };
}

// ----- AI 子模块：调用 LLM 改写 -----
async function callLLMRewrite(provider, apiKey, srcTitle, srcBody, opts) {
    const cfg = LLM_PROVIDERS[provider];
    if (!cfg) throw new Error('未知的 AI 提供商');
    opts = opts || {};

    const variant = opts.variant || 'balanced'; // balanced | fresh | safe
    const variantHint = ({
        balanced: '在保留爆款元素的前提下做"中等幅度"改写，避免重复度但保留信息',
        fresh:    '做"较大幅度"改写，结构和措辞都换一遍，但主旨不变',
        safe:     '做"轻微"改写，仅替换部分措辞和 emoji，保持原文骨架'
    })[variant];

    const sysPrompt = `你是资深的小红书爆款文案编辑。你的任务是把用户给的"原笔记"改写成一篇全新的、避免被算法判定为搬运的笔记。要求：
1. 必须降低文本重复度（同义替换 / 句式重组 / 段落重排），${variantHint}
2. 保留小红书风格：emoji 节奏 / 强情绪开头 / 短句换行 / 数字清单 / 段尾 CTA
3. 严格避开违禁词：电话、微信、QQ、加我、扫码、最低、第一、唯一、绝对
4. 输出严格 JSON：{"titles":["标题1","标题2","标题3"], "body":"改写后正文（用 \\n 换行）", "hashtags":["#标签1","#标签2",...]}
5. 标题 3 条要风格不同（数字盘点式 / 反差避雷式 / 强情绪感叹式 等）
6. hashtag 6-8 个，混搭"大词+小众词"
7. 不要任何额外解释，只返回 JSON`;

    const userPrompt = `【原笔记标题】\n${srcTitle}\n\n【原笔记正文】\n${srcBody}\n\n请输出改写结果（严格 JSON）。`;

    const body = {
        model: cfg.model,
        messages: [
            { role: 'system', content: sysPrompt },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.85,
        max_tokens: 2000,
        response_format: { type: 'json_object' } // OpenAI 兼容；不支持的会忽略
    };

    let resp;
    try {
        resp = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKey
            },
            body: JSON.stringify(body)
        });
    } catch (e) {
        throw new Error('网络/CORS 错误：' + e.message + '（如果是 CORS 错，请尝试切换提供商）');
    }

    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        if (resp.status === 401) throw new Error('API key 无效（401）。请检查 key 是否正确、是否过期');
        if (resp.status === 402 || resp.status === 429) throw new Error('额度不足或限流：' + txt.slice(0, 200));
        throw new Error(`LLM API 错误 ${resp.status}：${txt.slice(0, 200)}`);
    }

    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('LLM 返回为空');

    // 尝试解析 JSON；如果模型没严格遵守，做兜底
    let parsed = null;
    try {
        parsed = JSON.parse(content);
    } catch (_) {
        // 试着从文本中提取第一个 JSON 块
        const m = content.match(/\{[\s\S]*\}/);
        if (m) {
            try { parsed = JSON.parse(m[0]); } catch (_) {}
        }
    }
    if (!parsed || !Array.isArray(parsed.titles) || !parsed.body) {
        // 实在解析不出来，降级把 content 当 body 直出
        return {
            titles: [srcTitle + '（AI 改写版）'],
            body: content,
            hashtags: ['#AI改写'],
            _raw: true
        };
    }
    return {
        titles: parsed.titles.slice(0, 3).map(String),
        body: String(parsed.body),
        hashtags: (parsed.hashtags || []).map((t) => (String(t).startsWith('#') ? String(t) : '#' + t))
    };
}

// ----- AI 子模块：测试 API key 是否可用 -----
async function testLLMKey(provider, apiKey) {
    const cfg = LLM_PROVIDERS[provider];
    const resp = await fetch(cfg.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
        body: JSON.stringify({
            model: cfg.model,
            messages: [{ role: 'user', content: '回复一个字：好' }],
            max_tokens: 10
        })
    });
    if (resp.status === 401) throw new Error('API key 无效');
    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        throw new Error(`HTTP ${resp.status}：${txt.slice(0, 120)}`);
    }
    return true;
}

// =============================================================
// AI 润色「民宿特色介绍」 —— 复用 LLM_PROVIDERS / loadAiConfig
// =============================================================

// 三种润色风格的 system prompt
const POLISH_STYLE_PROMPTS = {
    pro: {
        name: '💼 专业卖点版',
        hint: '突出硬性卖点 + 适合 AI 平台抓取的结构化描述',
        sys: `你是资深的民宿/酒店 OTA 文案编辑。任务：把用户口语化的民宿描述，扩写成 250-450 字的专业卖点版。要求：
1. 结构化输出，明确包含：地理位置/周边交通、房间硬件、特色服务、目标客群、价格定位 5 个层面（每个 1-2 句）
2. 多用"具体的数字与名词"（如：步行 3 分钟、独立大露台、24h 热水、双人大床、提供精致早餐），避免"很好很棒"等空话
3. 风格平实、可信，避免感叹号堆砌，避免"绝美/yyds/巨/封神"等小红书风格用词
4. 自然融入 AI 平台关注的关键词：位置、价格区间、房型、设施、可预订时段
5. 不要"我们"开头，可以用"本民宿"/"院子"/"小屋"等名词作主语
6. 仅输出润色后的纯文本，不要标题、不要 Markdown、不要解释`
    },
    warm: {
        name: '🌸 温馨故事版',
        hint: '走情感线，适合发到小红书/微信公众号让人想住',
        sys: `你是擅长讲故事的民宿主理人。任务：把用户口语化的民宿描述，扩写成 250-400 字的温馨故事版。要求：
1. 用第一人称（"我们"/"主理人"），从一个具体场景切入（晨雾里的院子 / 黄昏的茶台 / 雨天的窗边等）
2. 自然带出位置、房型、特色服务，但不堆砌
3. 保留生活气息：可以提"早晨的咖啡"、"院子里的狗"、"傍晚的炊烟"
4. 文笔克制温柔，避免过度煽情，避免"绝美/yyds/巨"等用词
5. 收尾自然落到"欢迎你来住几天"这类邀请感
6. 仅输出润色后的纯文本，不要标题、不要 Markdown、不要解释`
    },
    data: {
        name: '📊 数据信任版',
        hint: '突出硬数据，适合官方反馈渠道 / OTA 商家入驻',
        sys: `你是民宿运营总监，正在向 OTA 平台提交招商资料。任务：把用户口语化的民宿描述，扩写成 250-400 字的数据信任版。要求：
1. 用"·"或"｜"分隔的结构化短句呈现，避免大段散文
2. 每个卖点尽量用数字：建筑面积、房间数、床型、距景点距离、价格区间、入住时长、预订渠道
3. 包含"硬指标"：营业执照、特种行业许可、消防、保险等任何合规相关字眼（用户没说就用通用表述）
4. 文风冷静、客观、可量化，类似投资 BP 风格
5. 避免感叹号、避免 emoji、避免"绝美/巨"等情绪词
6. 仅输出润色后的纯文本，不要标题、不要 Markdown、不要解释`
    }
};

// 调 LLM 做特色介绍润色
async function callLLMPolish(provider, apiKey, rawDescription, contextInfo, style) {
    const cfg = LLM_PROVIDERS[provider];
    if (!cfg) throw new Error('未知的 AI 提供商');
    const stylePrompt = POLISH_STYLE_PROMPTS[style] || POLISH_STYLE_PROMPTS.pro;

    // 把表单里其他字段也喂给 LLM，让它有上下文（不会瞎编没说过的内容）
    const ctx = [];
    if (contextInfo.hostelName1) ctx.push(`民宿名：${contextInfo.hostelName1}${contextInfo.hostelName2 ? ' / ' + contextInfo.hostelName2 : ''}`);
    if (contextInfo.location) ctx.push(`位置：${contextInfo.location}`);
    if (contextInfo.price) ctx.push(`价格区间：${contextInfo.price}`);

    const userPrompt = `${ctx.length ? '【已知信息】\n' + ctx.join('\n') + '\n\n' : ''}【用户的口语化描述（待润色）】\n${rawDescription}\n\n请输出润色后的完整文案（纯文本，不要解释、不要 Markdown 标记）。`;

    const body = {
        model: cfg.model,
        messages: [
            { role: 'system', content: stylePrompt.sys },
            { role: 'user', content: userPrompt }
        ],
        temperature: 0.75,
        max_tokens: 1200
    };

    let resp;
    try {
        resp = await fetch(cfg.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
            body: JSON.stringify(body)
        });
    } catch (e) {
        throw new Error('网络/CORS 错误：' + e.message);
    }

    if (!resp.ok) {
        const txt = await resp.text().catch(() => '');
        if (resp.status === 401) throw new Error('API key 无效（401）');
        if (resp.status === 402 || resp.status === 429) throw new Error('额度不足或限流：' + txt.slice(0, 200));
        throw new Error(`LLM 错误 ${resp.status}：${txt.slice(0, 200)}`);
    }
    const data = await resp.json();
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('LLM 返回为空');

    // 清理一些常见的污染：开头的"以下是..."、Markdown 围栏
    let text = String(content).trim()
        .replace(/^```[a-z]*\s*/i, '')
        .replace(/```\s*$/i, '')
        .replace(/^(以下是|这是|好的[，,]?\s*以下是)[^。]*?[:：]\s*/, '')
        .trim();
    return text;
}

// 初始化润色面板
function initDescPolish() {
    const btn = document.getElementById('descPolishBtn');
    const panel = document.getElementById('descPolishPanel');
    const statusEl = document.getElementById('descPolishStatus');
    const resultBox = document.getElementById('descPolishResult');
    const textEl = document.getElementById('descPolishText');
    const applyBtn = document.getElementById('descPolishApply');
    const redoBtn = document.getElementById('descPolishRedo');
    const cancelBtn = document.getElementById('descPolishCancel');
    const closeBtn = document.getElementById('descPolishClose');
    const styleBtns = panel ? panel.querySelectorAll('.polish-style-btn') : [];
    const descTextarea = document.getElementById('description');

    if (!btn || !panel || !descTextarea) return;

    let currentStyle = 'pro';

    const setStatus = (msg, kind) => {
        if (!statusEl) return;
        statusEl.textContent = msg || '';
        statusEl.className = 'polish-status' + (kind ? ' ' + kind : '');
        statusEl.style.display = msg ? 'block' : 'none';
    };

    const openPanel = () => {
        panel.style.display = 'block';
        resultBox.style.display = 'none';
        setStatus('', '');
    };
    const closePanel = () => {
        panel.style.display = 'none';
        setStatus('', '');
    };

    const runPolish = async () => {
        const raw = descTextarea.value.trim();
        if (!raw) {
            setStatus('请先在「民宿特色介绍」框里写一些内容（哪怕几句话），再让 AI 帮你润色。', 'err');
            resultBox.style.display = 'none';
            return;
        }
        // 用有效配置(无需用户配置,默认 builtin)
        const cfg = getEffectiveAiConfig();
        const providerName = LLM_PROVIDERS[cfg.provider] ? LLM_PROVIDERS[cfg.provider].name : cfg.provider;
        setStatus(`🤖 ${providerName} 正在润色（约 5-15 秒）…`, 'loading');
        resultBox.style.display = 'none';
        btn.disabled = true;
        redoBtn.disabled = true;
        try {
            const ctxInfo = {
                hostelName1: document.getElementById('hostelName1').value.trim(),
                hostelName2: document.getElementById('hostelName2').value.trim(),
                location: document.getElementById('location').value.trim(),
                price: document.getElementById('price').value.trim()
            };
            const polished = await callLLMPolish(cfg.provider, cfg.apiKey, raw, ctxInfo, currentStyle);
            textEl.textContent = polished;
            resultBox.style.display = 'block';
            setStatus(`✅ 已生成（${POLISH_STYLE_PROMPTS[currentStyle].name}）。可以再换一版，或应用到表单。`, 'ok');
        } catch (err) {
            setStatus('❌ ' + err.message, 'err');
        } finally {
            btn.disabled = false;
            redoBtn.disabled = false;
        }
    };

    btn.addEventListener('click', () => {
        // 第二次点击 = 重新打开 = 直接执行
        openPanel();
        runPolish();
    });

    redoBtn.addEventListener('click', runPolish);

    applyBtn.addEventListener('click', () => {
        const polished = textEl.textContent || '';
        if (!polished) return;
        descTextarea.value = polished;
        // 触发 input 事件以便草稿系统自动保存
        descTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        closePanel();
        if (typeof flashToast === 'function') flashToast('✨ 已应用 AI 润色后的内容到表单');
    });

    cancelBtn.addEventListener('click', closePanel);
    closeBtn.addEventListener('click', closePanel);

    styleBtns.forEach((b) => {
        b.addEventListener('click', () => {
            styleBtns.forEach((x) => x.classList.toggle('active', x === b));
            currentStyle = b.dataset.style || 'pro';
            // 切换风格后自动重新润色（如果已有结果）
            if (resultBox.style.display === 'block') runPolish();
        });
    });
}



// 同义词词库（左 → 右随机抽一个）
const XHS_SYNONYMS = [
    [/姐妹们?/g, ['姐妹们', '宝子们', '集美们', '家人们', '小仙女们']],
    [/绝了|绝绝子/g, ['绝了', '封神了', 'yyds', '太可了', '直接拿捏', '我哭了']],
    [/超级|非常|特别/g, ['超级', '巨', '贼', '真的', '是真的']],
    [/好看|美/g, ['好看', '出片', '神仙颜值', '氛围感拉满', '审美在线']],
    [/推荐/g, ['推荐', '安利', '种草', '强烈安利']],
    [/便宜|实惠/g, ['性价比高', '不贵', '巨划算', '良心价']],
    [/真的/g, ['真的', '真心', '不夸张', '一点不夸张']],
    [/喜欢/g, ['喜欢', '爱了爱了', '心动了', '上头了']],
    [/不错/g, ['不错', '可以的', '挺香', '惊喜']],
    [/舒服|舒适/g, ['舒服', '巨舒服', '松弛感拉满', '治愈']],
    [/干净/g, ['干净', '巨干净', '一尘不染', '酒店级整洁']],
    [/老板|店主|主理人/g, ['老板', '主理人', '店家', '店主']],
    [/分享/g, ['分享', '掏出来', '不私藏分享', '安利']],
    [/避雷/g, ['避雷', '踩坑', '排雷']],
    [/必去|必住/g, ['必去', '必打卡', '不能错过', '冲就完了']],
    [/真心/g, ['真心', '掏心窝子', '说真的']],
    [/震撼|惊艳/g, ['震撼', '惊艳到', '直接破防', '一秒沦陷']],
    [/拍照/g, ['拍照', '出片', '咔咔拍', '随便拍都好看']],
    [/朋友/g, ['朋友', '闺蜜', '宝子', '小姐妹']],
    [/今天|昨天|前几天/g, ['上周', '前两天', '最近', '上个月']],
    [/我觉得|我认为/g, ['我感觉', '说真的', '不瞒你说', '讲真']]
];

// emoji 池 —— 按位置/语义分组，随机抽
const XHS_EMOJI_POOLS = {
    open:   ['🌿', '✨', '🍃', '🤍', '🌷', '🍀', '🥹', '🌸'],
    point:  ['📍', '📌', '🎯', '🔖', '🏷'],
    house:  ['🏡', '🏠', '🛏', '🪟'],
    money:  ['💰', '💸', '🏷'],
    food:   ['🍳', '🥐', '☕', '🍵', '🍰'],
    star:   ['⭐', '🌟', '✨', '💫'],
    heart:  ['❤️', '💗', '🤍', '💖', '🩷'],
    cta:    ['👇', '🥰', '🌈', '🎁', '✉️'],
    pos:    ['✅', '✔️', '🟢'],
    neg:    ['🚫', '❌', '⚠️']
};

function pickEmoji(group) {
    const pool = XHS_EMOJI_POOLS[group] || XHS_EMOJI_POOLS.star;
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickSyn(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// 标题公式：把原标题的"主语 + 修饰"套进不同句式
const XHS_TITLE_FORMULAS = [
    {
        name: '数字盘点式',
        example: '8 个细节告诉我，{核心}真的封神',
        build: (kw) => {
            const n = [3, 5, 6, 7, 8][Math.floor(Math.random() * 5)];
            const tails = ['真的封神', '一个比一个戳', '建议私藏', '看完直接冲', '我哭了'];
            return `${n} 个细节告诉我，${kw} ${pickSyn(tails)}${pickEmoji('star')}`;
        }
    },
    {
        name: '反差避雷式',
        example: '别再被 XX 骗了！{核心}才是天花板',
        build: (kw) => {
            const heads = ['别再被网图骗了', '踩了 5 次雷之后', '试过 8 家终于发现', '刷了一周攻略'];
            const tails = ['才是天花板', '才是真宝藏', '原来才是答案', '是真心推荐'];
            return `${pickSyn(heads)}！${kw}${pickSyn(tails)}${pickEmoji('point')}`;
        }
    },
    {
        name: '强种草感叹式',
        example: '绝！{核心}谁来谁封神',
        build: (kw) => {
            const opens = ['绝！', '我哭了！', '太可了！', '神仙！', '封神！'];
            const tails = ['谁来谁封神', '不允许还有人不知道', '这次真的栽了', '一秒沦陷'];
            return `${pickSyn(opens)}${kw}，${pickSyn(tails)}${pickEmoji('heart')}`;
        }
    },
    {
        name: '身份代入式',
        example: '作为 i 人，{核心}是真心舒服',
        build: (kw) => {
            const ids = ['作为 i 人', '作为社恐', '作为打工人', '作为颜控', '作为完美主义'];
            const verbs = ['是真心舒服', '我打 100 分', '住一次就上头', '强烈想推给所有人'];
            return `${pickSyn(ids)}，${kw} ${pickSyn(verbs)}${pickEmoji('open')}`;
        }
    },
    {
        name: '体验日记式',
        example: '在 {核心} 住了 2 天，治好了我的精神内耗',
        build: (kw) => {
            const days = ['住了 2 天', '待了一晚', '体验完一整天', '住了一个周末'];
            const heals = ['治好了我的精神内耗', '把我整个人都松弛了', '回家想再去一次', '直接续命一周'];
            return `在 ${kw} ${pickSyn(days)}，${pickSyn(heals)}${pickEmoji('open')}`;
        }
    },
    {
        name: '数字 + 人群定向',
        example: '🌿 ${city}小众民宿｜亲子党闭眼冲',
        build: (kw) => {
            const groups = ['亲子党', '情侣党', '闺蜜局', '独行侠', 'i 人 / 社恐'];
            const verbs = ['闭眼冲', '本命之选', '抄作业不会错', '盲订也不亏'];
            return `${pickEmoji('open')} ${kw}｜${pickSyn(groups)}${pickSyn(verbs)}`;
        }
    }
];

// 从原始正文中抽出"核心关键词"作为标题主语
function extractCoreKeyword(srcLines) {
    if (!srcLines.length) return '它';
    // 优先用第一行（通常就是原标题）的精炼版
    const first = srcLines[0].trim();
    // 去掉 emoji 和过长尾巴
    let kw = first.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').trim();
    // 去掉常见前缀
    kw = kw.replace(/^[!！\s]*(绝了|宝藏|强烈推荐|分享一下|无意中)/g, '').trim();
    // 砍到 18 字以内
    if (kw.length > 18) kw = kw.slice(0, 18) + '…';
    return kw || '这家宝藏';
}

// 对单句做同义词替换 + 随机插入 emoji
function rewriteSentence(sentence) {
    let s = sentence;
    XHS_SYNONYMS.forEach(([re, opts]) => {
        s = s.replace(re, () => pickSyn(opts));
    });
    // 30% 概率在句首加一个 emoji（只对较长句子）
    if (s.length > 8 && Math.random() < 0.3) {
        s = pickEmoji(Math.random() < 0.5 ? 'open' : 'star') + ' ' + s;
    }
    // 20% 概率把句尾的句号换成感叹号或省略号
    if (Math.random() < 0.2) {
        s = s.replace(/[。.]$/, () => (Math.random() < 0.5 ? '！' : '…'));
    }
    return s;
}

// 主函数：输入原文（多行字符串），输出 { titles, body, hashtags }
function rewriteXhsText(srcRaw) {
    const cleaned = (srcRaw || '').trim();
    if (!cleaned) return null;

    // 拆行：把原文按换行切分，去空行
    const rawLines = cleaned.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);

    // 取第一行作为标题候选输入；其余作为正文段
    const core = extractCoreKeyword(rawLines);
    const bodyLines = rawLines.length > 1 ? rawLines.slice(1) : rawLines;

    // 生成 3 个候选标题（不重复公式）
    const formulasShuffled = [...XHS_TITLE_FORMULAS].sort(() => Math.random() - 0.5);
    const titles = formulasShuffled.slice(0, 3).map((f) => ({
        formula: f.name,
        text: f.build(core)
    }));

    // 改写正文：每行单独改写
    const newBody = bodyLines.map((ln) => {
        // 把行内的"。"分句也分别改写后再拼回
        const parts = ln.split(/(?<=[。！？!?])/).map((p) => p.trim()).filter(Boolean);
        return parts.map(rewriteSentence).join('');
    }).join('\n\n'); // 段落间留一个空行，更小红书

    // 推荐 hashtag（基于核心词 + 通用池）
    const hashtagPool = [
        '小众宝藏', '出片民宿', '周末去哪儿', '治愈系',
        '氛围感拉满', '小众旅行', '精致生活', '自留地分享',
        '我的本命民宿', '不踩雷推荐', '夏日旅行', '冬日避世'
    ];
    const hashtagShuffled = [...hashtagPool].sort(() => Math.random() - 0.5);
    const hashtags = hashtagShuffled.slice(0, 6).map((t) => `#${t}`);

    // 拼出最终笔记主体（标题 + 正文 + CTA + hashtag）
    const cta = pickSyn([
        '想知道在哪订的，评论区扣 1 我发主页置顶',
        '主页有完整攻略，记得点关注 ❤',
        '想了解的姐妹评论区戳我',
        '真心推荐，看完点个收藏不迷路'
    ]);

    return {
        titles,
        body: newBody,
        cta: pickEmoji('cta') + ' ' + cta,
        hashtags
    };
}

// 爆款公式速查表（独立面板用）
const XHS_FORMULAS_CHEAT = [
    {
        type: '标题公式',
        items: [
            { name: '数字+痛点+反转', example: '试过 8 家民宿才懂：贵 ≠ 好', tip: '数字给具体感、反差勾点击' },
            { name: '强情绪开场', example: '绝！我不允许还有姐妹不知道这家', tip: '前 7 个字决定点击率' },
            { name: '身份代入', example: '作为 i 人，我把它列入本命民宿清单', tip: '让目标人群秒对号入座' },
            { name: '反向避雷', example: '避雷｜这 3 家网红民宿真心不推荐', tip: '小红书"避雷"题材天然高互动' },
            { name: '提问悬念', example: '为什么 ${city} 民宿最近都在被抢？', tip: '问号引导用户进笔记找答案' }
        ]
    },
    {
        type: '正文结构',
        items: [
            { name: '总-分-总', example: '先一句结论 → 3-5 个分论点 → CTA', tip: '小红书完读率 > 长篇大论' },
            { name: '日记 / vlog 体', example: 'day1…day2…用第一人称' , tip: '比"卖货式介绍"完读率高 2 倍' },
            { name: '清单体', example: '1️⃣2️⃣3️⃣ 编号清晰', tip: '阅读爽感 + 易复制' }
        ]
    },
    {
        type: '加分细节',
        items: [
            { name: 'emoji 节奏', example: '🌿✨📍 段首点缀，不要堆', tip: '每段 1-2 个，多了反而乱' },
            { name: '换行切短', example: '一句一行，不超过 15 字', tip: '小红书是手机阅读，长行劝退' },
            { name: '关键词加粗', example: '用「」或【】突出主关键词', tip: '搜索权重 + 视觉抓人' },
            { name: 'hashtag 6-10 个', example: '混搭"大词+小众词"', tip: '大词带流量，小众词定位精准' }
        ]
    },
    {
        type: '风控红线（违禁会限流）',
        items: [
            { name: '禁止手机/微信/QQ', example: '正文不能放电话、加 V', tip: '想留联系：放主页签名' },
            { name: '禁止"加我"等引流话术', example: '"D 我""扫码加"会被限流', tip: '改成"评论戳我"' },
            { name: '慎用绝对化用词', example: '"全网最低""第一""唯一"', tip: '广告法红线，会被审核驳回' },
            { name: '原图 > 网图', example: '盗图 / 全网通用图易被判搬运', tip: '至少 3 张自己拍的实景' }
        ]
    }
];

function renderXhsFormulas() {
    const wrap = document.getElementById('xhsFormulasBody');
    if (!wrap) return;
    wrap.innerHTML = XHS_FORMULAS_CHEAT.map((group) => `
        <div class="formula-group">
            <h4 class="formula-group-title">${escapeHtml(group.type)}</h4>
            <ul class="formula-list">
                ${group.items.map((it) => `
                    <li>
                        <strong>${escapeHtml(it.name)}</strong>
                        <span class="formula-eg">例："${escapeHtml(it.example)}"</span>
                        <span class="formula-tip">💡 ${escapeHtml(it.tip)}</span>
                    </li>
                `).join('')}
            </ul>
        </div>
    `).join('');
}

// 渲染改写输出区
function renderXhsRewriteOutput(result) {
    const out = document.getElementById('xhsRewriteOutput');
    if (!out) return;
    if (!result) {
        out.style.display = 'none';
        out.innerHTML = '';
        return;
    }
    const titlesHtml = result.titles.map((t, i) => `
        <li class="rewrite-title-item">
            <span class="rewrite-title-tag">${i + 1}</span>
            <div class="rewrite-title-content">
                <p class="rewrite-title-text">${escapeHtml(t.text)}</p>
                <small class="rewrite-title-formula">公式：${escapeHtml(t.formula)}</small>
            </div>
            <button type="button" class="btn-tool btn-copy-title" data-text="${escapeHtml(t.text)}">📋 复制</button>
        </li>
    `).join('');

    const fullText = `${result.titles[0].text}\n\n${result.body}\n\n${result.cta}\n\n${result.hashtags.join(' ')}`;

    out.innerHTML = `
        <div class="rewrite-section">
            <h4 class="rewrite-section-title">🪄 候选标题（点复制单个，或下方一键复制全文）</h4>
            <ul class="rewrite-titles">${titlesHtml}</ul>
        </div>

        <div class="rewrite-section">
            <h4 class="rewrite-section-title">📝 改写后正文</h4>
            <pre class="rewrite-body">${escapeHtml(result.body)}</pre>
        </div>

        <div class="rewrite-section">
            <h4 class="rewrite-section-title">📣 推荐 CTA + Hashtag</h4>
            <pre class="rewrite-extras">${escapeHtml(result.cta)}\n\n${escapeHtml(result.hashtags.join(' '))}</pre>
        </div>

        <div class="rewrite-actions-bottom">
            <button type="button" class="btn-primary btn-copy-open-xhs" title="一步：完整笔记进剪贴板 + 小红书发布页在新标签打开">
                🚀 复制并去小红书发布页 →
            </button>
            <button type="button" class="btn-secondary btn-copy-all">📋 仅复制完整笔记</button>
        </div>

        <p class="rewrite-howto">
            💡 点 <strong>� 复制并去小红书发布页</strong>：内容自动进剪贴板，发布页在新标签打开 → 在小红书页面 <code>Ctrl+V</code> 粘贴标题+正文 → 拖入图片 → 发布
        </p>

        <p class="rewrite-disclaimer">
            ⚠️ 这是<strong>规则化改写</strong>，不是真正的 AI 改写。建议：把上面的输出当"半成品"，加入<strong>你自己的真实体验细节</strong>（具体房间号、店主对话、当天天气）会让 AI 平台和小红书算法都判定为<strong>原创内容</strong>。
        </p>
        <p class="rewrite-disclaimer" style="background:#eef2ff;border-color:#c7d2fe;color:#3730a3">
            🔒 <strong>为什么不能 0 操作直接灌进发布页？</strong> 浏览器同源策略不允许任何网页操控其他网站的输入框（否则任何网站都能控制你登录的银行/邮箱页面）。「复制+跳转 + Ctrl+V」是<strong>浏览器允许的最丝滑方案</strong>，整个流程实测 < 5 秒。
        </p>
    `;

    out.style.display = 'block';

    // 单条标题复制
    out.querySelectorAll('.btn-copy-title').forEach((b) => {
        b.addEventListener('click', () => {
            copyTextToClipboard(b.dataset.text, b);
        });
    });

    // 仅复制完整笔记
    const copyAllBtn = out.querySelector('.btn-copy-all');
    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', () => {
            copyTextToClipboard(fullText, copyAllBtn);
        });
    }

    // 复制并跳转小红书发布页
    const copyOpenBtn = out.querySelector('.btn-copy-open-xhs');
    if (copyOpenBtn) {
        copyOpenBtn.addEventListener('click', (ev) => {
            copyAndOpen(
                fullText,
                'https://creator.xiaohongshu.com/publish/publish',
                ev.currentTarget,
                '小红书创作中心'
            );
        });
    }
}

// 当前改写模式：'local'（本地词库）| 'ai'（AI 联网改写）
let currentRewriteMode = 'local';
// 上次抓取/粘贴的内容缓存（标题 + 正文），用于"再洗一版"复用
let lastRewriteContext = null; // { title, body, urlTried }

// 渲染改写器顶部的状态/loading 行
function renderRewriterStatus(msg, kind) {
    const el = document.getElementById('xhsRewriterStatus');
    if (!el) return;
    if (!msg) {
        el.style.display = 'none';
        el.innerHTML = '';
        return;
    }
    el.className = 'rewriter-status rewriter-status-' + (kind || 'info');
    el.innerHTML = (kind === 'loading' ? '<span class="loading-dot"></span> ' : '') + escapeHtml(msg);
    el.style.display = '';
}

// 设置改写器模式 UI（按钮高亮、AI key 行可见性等）
function applyRewriteModeUI() {
    const btnLocal = document.getElementById('rewriteModeLocal');
    const btnAi = document.getElementById('rewriteModeAi');
    const aiBar = document.getElementById('xhsAiKeyBar');
    if (btnLocal) btnLocal.classList.toggle('active', currentRewriteMode === 'local');
    if (btnAi) btnAi.classList.toggle('active', currentRewriteMode === 'ai');
    if (aiBar) aiBar.style.display = currentRewriteMode === 'ai' ? '' : 'none';

    // 同步显示 AI 配置摘要
    if (currentRewriteMode === 'ai') {
        const cfg = getEffectiveAiConfig();
        const sumEl = document.getElementById('xhsAiKeySummary');
        if (sumEl) {
            const p = LLM_PROVIDERS[cfg.provider];
            if (cfg.isBuiltin) {
                sumEl.innerHTML = `🎁 当前使用 <strong>内建 AI</strong>（免配置·开箱即用） · <a href="#" id="xhsAiKeyChange">用自己的 key</a>`;
                const changeBtn = document.getElementById('xhsAiKeyChange');
                if (changeBtn) changeBtn.addEventListener('click', (e) => { e.preventDefault(); openAiSetupModal(); });
            } else if (p) {
                sumEl.innerHTML = `✅ 已配置 <strong>${escapeHtml(p.name)}</strong>（key 已存本地） · <a href="#" id="xhsAiKeyChange">修改</a> · <a href="#" id="xhsAiKeyClear">用回内建</a>`;
                const changeBtn = document.getElementById('xhsAiKeyChange');
                const clearBtn = document.getElementById('xhsAiKeyClear');
                if (changeBtn) changeBtn.addEventListener('click', (e) => { e.preventDefault(); openAiSetupModal(); });
                if (clearBtn) clearBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('清除自己的 key 后会回退到「内建 AI」,确定吗?')) {
                        clearAiConfig();
                        applyRewriteModeUI();
                        flashToast('已切回内建 AI');
                    }
                });
            }
        }
    }
}

// 打开 API 设置模态
function openAiSetupModal() {
    const modal = document.getElementById('xhsAiSetupModal');
    if (!modal) return;
    const sel = modal.querySelector('#aiSetupProvider');
    const keyInput = modal.querySelector('#aiSetupKey');
    const cur = loadAiConfig();
    if (cur) {
        if (sel) sel.value = cur.provider;
        if (keyInput) keyInput.value = cur.apiKey;
    }
    updateProviderDescUI();
    modal.style.display = 'flex';
}

function closeAiSetupModal() {
    const modal = document.getElementById('xhsAiSetupModal');
    if (modal) modal.style.display = 'none';
}

function updateProviderDescUI() {
    const sel = document.getElementById('aiSetupProvider');
    const desc = document.getElementById('aiSetupDesc');
    const link = document.getElementById('aiSetupSignup');
    const keyInput = document.getElementById('aiSetupKey');
    const keyRow = document.getElementById('aiSetupKeyRow');
    const linkRow = document.getElementById('aiSetupLinkRow');
    if (!sel || !desc) return;
    const cfg = LLM_PROVIDERS[sel.value];
    if (!cfg) return;
    desc.innerHTML = `<strong>${escapeHtml(cfg.tag)}</strong> ${escapeHtml(cfg.desc)}`;

    // noKey provider(如 builtin):隐藏申请链接 + key 输入框
    const isNoKey = !!cfg.noKey;
    if (linkRow) linkRow.style.display = isNoKey ? 'none' : '';
    if (keyRow)  keyRow.style.display  = isNoKey ? 'none' : '';

    if (link && cfg.signupUrl) {
        link.href = cfg.signupUrl;
        link.textContent = '去申请 ' + cfg.name + ' API key';
    }
    if (keyInput) keyInput.placeholder = cfg.keyHint || '';
}

function bindAiSetupModal() {
    const sel = document.getElementById('aiSetupProvider');
    if (sel) sel.addEventListener('change', updateProviderDescUI);

    const closeBtn = document.getElementById('aiSetupClose');
    if (closeBtn) closeBtn.addEventListener('click', closeAiSetupModal);

    const cancelBtn = document.getElementById('aiSetupCancel');
    if (cancelBtn) cancelBtn.addEventListener('click', closeAiSetupModal);

    const testBtn = document.getElementById('aiSetupTest');
    const saveBtn = document.getElementById('aiSetupSave');
    const status = document.getElementById('aiSetupStatus');

    if (testBtn) testBtn.addEventListener('click', async () => {
        const provider = document.getElementById('aiSetupProvider').value;
        const p = LLM_PROVIDERS[provider];
        let key = document.getElementById('aiSetupKey').value.trim();
        if (p && p.noKey) key = BUILTIN_AI.apiKey;
        else if (!key) { status.textContent = '请先填 API key'; status.className = 'ai-setup-status err'; return; }
        status.className = 'ai-setup-status loading';
        status.innerHTML = '<span class="loading-dot"></span> 正在测试连接…';
        testBtn.disabled = true;
        try {
            await testLLMKey(provider, key);
            status.className = 'ai-setup-status ok';
            status.textContent = '✅ 连接成功！可以保存了';
        } catch (e) {
            status.className = 'ai-setup-status err';
            status.textContent = '❌ 测试失败：' + e.message;
        } finally {
            testBtn.disabled = false;
        }
    });

    if (saveBtn) saveBtn.addEventListener('click', () => {
        const provider = document.getElementById('aiSetupProvider').value;
        const p = LLM_PROVIDERS[provider];
        let key = document.getElementById('aiSetupKey').value.trim();
        if (p && p.noKey) {
            key = BUILTIN_AI.apiKey;
        } else if (!key) {
            status.textContent = '请先填 API key'; status.className = 'ai-setup-status err'; return;
        }
        saveAiConfig(provider, key);
        status.className = 'ai-setup-status ok';
        status.textContent = '✅ 已保存到本地浏览器';
        setTimeout(() => {
            closeAiSetupModal();
            applyRewriteModeUI();
        }, 600);
    });
}

// 主流程：根据当前模式跑改写
async function runRewriteFlow(opts) {
    opts = opts || {};
    const isReroll = !!opts.reroll;
    const txt = document.getElementById('xhsSourceText');
    const url = document.getElementById('xhsSourceUrl');
    const btnGo = document.getElementById('xhsRewriteBtn');
    const btnRefresh = document.getElementById('xhsRewriteRefreshBtn');

    // 1) 准备原始内容（标题 + 正文）
    let title = '';
    let body = '';

    if (isReroll && lastRewriteContext) {
        // 直接复用上次抓取/粘贴的内容
        title = lastRewriteContext.title;
        body = lastRewriteContext.body;
    } else {
        const urlVal = url ? url.value.trim() : '';
        const textVal = txt ? txt.value.trim() : '';

        // AI 模式：如果填了 URL，先尝试 Jina 抓取
        if (currentRewriteMode === 'ai' && urlVal && !textVal) {
            renderRewriterStatus('🌐 正在通过 Jina Reader 抓取链接内容（约 5-15 秒）…', 'loading');
            btnGo.disabled = true;
            try {
                const md = await fetchViaJina(urlVal);
                const tb = extractTitleBody(md);
                title = tb.title;
                body = tb.body;
                if (txt) txt.value = (title ? title + '\n\n' : '') + body;
                renderRewriterStatus('✅ 已抓取到内容（已自动填入文本框）', 'ok');
            } catch (e) {
                btnGo.disabled = false;
                renderRewriterStatus('❌ 抓取失败：' + e.message + '。请把笔记正文手动粘贴到下方文本框。', 'err');
                if (txt) txt.focus();
                return;
            }
            btnGo.disabled = false;
        } else if (textVal) {
            // 用文本框内容
            const lines = textVal.split(/\r?\n+/).map((l) => l.trim()).filter(Boolean);
            if (lines.length > 1) {
                title = lines[0];
                body = lines.slice(1).join('\n');
            } else {
                title = '';
                body = textVal;
            }
        } else {
            alert(currentRewriteMode === 'ai'
                ? '请粘贴笔记链接（AI 会自动抓取）或直接粘贴正文。'
                : '请把对方笔记的正文复制粘贴到下方文本框。');
            (txt || url).focus();
            return;
        }

        lastRewriteContext = { title, body, urlTried: urlVal };
    }

    // 2) 跑改写
    if (currentRewriteMode === 'local') {
        // 本地词库（合成原文 = 标题 + 正文 喂给 rewriteXhsText）
        const composed = (title ? title + '\n' : '') + body;
        const result = rewriteXhsText(composed);
        renderXhsRewriteOutput(result);
        renderRewriterStatus('', null);
        if (btnRefresh) btnRefresh.disabled = false;
        flashToast(isReroll ? '🔄 已再洗一版（本地）' : '✨ 已生成（本地词库）');
    } else {
        // AI 改写(默认用 builtin 兜底,无需用户配置)
        const cfg = getEffectiveAiConfig();
        renderRewriterStatus('🤖 ' + LLM_PROVIDERS[cfg.provider].name + ' 正在改写（约 3-10 秒）…', 'loading');
        if (btnGo) btnGo.disabled = true;
        if (btnRefresh) btnRefresh.disabled = true;
        try {
            // 每次刷新换一个 variant，让结果差异更大
            const variants = ['balanced', 'fresh', 'safe'];
            const variant = variants[Math.floor(Math.random() * variants.length)];
            const result = await callLLMRewrite(cfg.provider, cfg.apiKey, title, body, { variant });
            // 用 LLM 结果填进 renderXhsRewriteOutput 兼容的格式
            renderXhsRewriteOutput({
                titles: result.titles.map((t, i) => ({ formula: 'AI 生成', text: t })),
                body: result.body,
                cta: '',
                hashtags: result.hashtags || []
            });
            renderRewriterStatus(`✅ AI 改写完成（${LLM_PROVIDERS[cfg.provider].name} · ${variant} 变体）`, 'ok');
            flashToast(isReroll ? '🔄 已再洗一版（AI）' : '✨ AI 改写完成');
        } catch (e) {
            renderRewriterStatus('❌ AI 改写失败：' + e.message, 'err');
        } finally {
            if (btnGo) btnGo.disabled = false;
            if (btnRefresh) btnRefresh.disabled = false;
        }
    }
}

// 绑定改写器按钮
function initXhsRewriter() {
    const btnGo = document.getElementById('xhsRewriteBtn');
    const btnRefresh = document.getElementById('xhsRewriteRefreshBtn');
    const btnClear = document.getElementById('xhsRewriteClearBtn');
    const txt = document.getElementById('xhsSourceText');
    const url = document.getElementById('xhsSourceUrl');
    const btnLocal = document.getElementById('rewriteModeLocal');
    const btnAi = document.getElementById('rewriteModeAi');
    if (!btnGo || !txt) return;

    if (btnLocal) btnLocal.addEventListener('click', () => {
        currentRewriteMode = 'local';
        applyRewriteModeUI();
    });
    if (btnAi) btnAi.addEventListener('click', () => {
        currentRewriteMode = 'ai';
        applyRewriteModeUI();
    });

    btnGo.addEventListener('click', () => runRewriteFlow({ reroll: false }));
    btnRefresh.addEventListener('click', () => {
        if (!lastRewriteContext) return;
        runRewriteFlow({ reroll: true });
    });

    btnClear.addEventListener('click', () => {
        txt.value = '';
        if (url) url.value = '';
        lastRewriteContext = null;
        renderXhsRewriteOutput(null);
        renderRewriterStatus('', null);
        btnRefresh.disabled = true;
        txt.focus();
    });

    // 默认选 AI 模式（内建 AI 免配置,直接可用）
    currentRewriteMode = 'ai';
    applyRewriteModeUI();
    bindAiSetupModal();
}

// 启动时初始化
initXhsRewriter();
renderXhsFormulas();

// =============================================================
// Tabs 切换
// =============================================================
document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
        document.querySelectorAll('.tab-pane').forEach((p) =>
            p.classList.toggle('active', p.dataset.pane === tab)
        );
    });
});

// 工具：HTML 转义，避免用户输入注入卡片
function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// 用 ★/☆ 表示成功率
function renderStars(n) {
    const full = Math.max(0, Math.min(5, n));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
}

// 创建一张平台卡片（含定制文案 + 真实跳转入口 + 复制按钮 + 二维码 + 已提交标记 + 风格/丰富 切换）
function createPlatformCard(platformId, formData) {
    const platform = AI_PLATFORMS[platformId];
    if (!platform) return null;

    // 卡片自身的文案状态（每张卡片独立维护）
    let styleIdx = 0;       // 当前风格在 TEXT_STYLES 中的索引
    let enrichLevel = 0;    // 当前已叠加的丰富段数 0..ENRICH_MAX

    const getCurrentText = () =>
        generateSubmissionText(formData, platform.name, {
            style: TEXT_STYLES[styleIdx].id,
            enrichLevel
        });

    const alreadySubmitted = hasRecord(formData, platformId);

    const card = document.createElement('div');
    card.className = 'platform-card';
    card.style.borderLeftColor = platform.color;
    card.innerHTML = `
        <div class="platform-card-head">
            <div class="platform-card-title">
                <span class="platform-card-emoji">${platform.emoji}</span>
                <span>${escapeHtml(platform.name)}</span>
            </div>
            <div class="platform-card-meta">
                <span class="platform-card-score-slot"></span>
                <span title="平均成功率">${renderStars(platform.successRate)}</span>
                <span class="platform-card-eta">⏱ ${escapeHtml(platform.eta)}</span>
            </div>
        </div>
        <div class="platform-card-grid">
            <div class="platform-card-body">
                <p class="platform-card-entry"><strong>提交入口：</strong>${escapeHtml(platform.entryPath)}</p>
                <p class="platform-card-contact"><strong>联系方式：</strong>${escapeHtml(platform.contact)}</p>

                <div class="platform-card-toolbar" role="group" aria-label="文案样式调整">
                    <span class="toolbar-label">📝 文案样式</span>
                    <button type="button" class="btn-tool btn-style" title="点击循环切换 4 种风格">
                        🎨 <span class="tool-name">${escapeHtml(TEXT_STYLES[0].name)}</span>
                        <span class="badge-mini tool-style-idx">1/${TEXT_STYLES.length}</span>
                    </button>
                    <button type="button" class="btn-tool btn-enrich" title="在当前风格基础上追加附加段，最多 ${ENRICH_MAX} 段">
                        ✨ 丰富细节 <span class="badge-mini tool-enrich-lv">+0/${ENRICH_MAX}</span>
                    </button>
                    <button type="button" class="btn-tool btn-tool-reset" title="恢复默认（商务正式版 / 不附加）">↺</button>
                </div>

                <details class="platform-card-text">
                    <summary>查看为本平台生成的文案</summary>
                    <pre class="platform-card-pre"></pre>
                </details>

                <details class="platform-card-score">
                    <summary>查看详细诊断 <span class="score-summary-num"></span></summary>
                    <div class="score-detail-slot"></div>
                </details>
            </div>
            <div class="platform-card-qr">
                <div class="qr-box" data-qr-url="${escapeHtml(platform.officialUrl)}"></div>
                <small class="qr-hint">手机扫码<br>打开官网</small>
            </div>
        </div>
        <div class="platform-card-actions">
            <button type="button" class="btn-secondary btn-copy">📋 复制文案</button>
            <a class="btn-primary btn-open" href="${escapeHtml(platform.officialUrl)}" target="_blank" rel="noopener noreferrer">🔗 打开官方入口</a>
            <button type="button" class="btn-mark${alreadySubmitted ? ' btn-mark-done' : ''}">
                ${alreadySubmitted ? '✓ 已记录' : '✅ 标记为已提交'}
            </button>
        </div>
    `;

    const preEl = card.querySelector('.platform-card-pre');
    const detailsEl = card.querySelector('.platform-card-text');
    const styleBtn = card.querySelector('.btn-style');
    const styleNameEl = card.querySelector('.tool-name');
    const styleIdxEl = card.querySelector('.tool-style-idx');
    const enrichBtn = card.querySelector('.btn-enrich');
    const enrichLvEl = card.querySelector('.tool-enrich-lv');
    const resetBtn = card.querySelector('.btn-tool-reset');
    const scoreSlot = card.querySelector('.platform-card-score-slot');
    const scoreDetailSlot = card.querySelector('.score-detail-slot');
    const scoreSummaryNum = card.querySelector('.score-summary-num');

    // 刷新卡片文案 + 工具栏显示
    const refresh = (autoOpen) => {
        const txt = getCurrentText();
        preEl.textContent = txt;
        styleNameEl.textContent = TEXT_STYLES[styleIdx].name;
        styleIdxEl.textContent = `${styleIdx + 1}/${TEXT_STYLES.length}`;
        enrichLvEl.textContent = `+${enrichLevel}/${ENRICH_MAX}`;
        enrichBtn.disabled = enrichLevel >= ENRICH_MAX;

        // 同步刷新文案体检评分
        if (scoreSlot && scoreDetailSlot && scoreSummaryNum) {
            const sc = scoreContent(txt, formData, platformId);
            scoreSlot.innerHTML = renderScoreBadge(sc);
            scoreDetailSlot.innerHTML = renderScoreDetail(sc);
            scoreSummaryNum.innerHTML = `<span class="score-summary-tag score-${sc.level.tag}">${sc.score}/100 · ${escapeHtml(sc.level.label)}</span>`;
            // 头部徽章 click → 展开底部诊断 details + 滚动到位
            const badgeBtn = scoreSlot.querySelector('[data-action="open-score-detail"]');
            const scoreDetails = card.querySelector('.platform-card-score');
            if (badgeBtn && scoreDetails) {
                badgeBtn.addEventListener('click', () => {
                    scoreDetails.open = !scoreDetails.open;
                    if (scoreDetails.open) {
                        scoreDetails.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                });
            }
        }

        // 闪一下，提示内容已变
        preEl.classList.remove('flash');
        // 触发回流以重启动画
        // eslint-disable-next-line no-unused-expressions
        void preEl.offsetWidth;
        preEl.classList.add('flash');
        if (autoOpen) detailsEl.open = true;
    };

    // 初始渲染
    refresh(false);

    // 复制按钮：使用最新文案
    const copyBtn = card.querySelector('.btn-copy');
    copyBtn.addEventListener('click', () => copyTextToClipboard(getCurrentText(), copyBtn));

    // 切换风格
    styleBtn.addEventListener('click', () => {
        styleIdx = (styleIdx + 1) % TEXT_STYLES.length;
        refresh(true);
    });

    // 丰富细节 +1
    enrichBtn.addEventListener('click', () => {
        if (enrichLevel >= ENRICH_MAX) return;
        enrichLevel += 1;
        refresh(true);
    });

    // 恢复默认
    resetBtn.addEventListener('click', () => {
        styleIdx = 0;
        enrichLevel = 0;
        refresh(false);
    });

    // 二维码
    const qrBox = card.querySelector('.qr-box');
    renderQrInto(qrBox, platform.officialUrl);

    // "标记已提交" 按钮 → 写入 localStorage 台账
    const markBtn = card.querySelector('.btn-mark');
    markBtn.addEventListener('click', () => {
        if (markBtn.classList.contains('btn-mark-done')) {
            renderRecordsTable();
            if (recordsModal) recordsModal.style.display = 'block';
            return;
        }
        addRecord(formData, platformId);
        markBtn.classList.add('btn-mark-done');
        markBtn.textContent = '✓ 已记录';
        flashToast(`已记录「${platform.name}」的提交。可在右上角"提交记录"中查看。`);
    });

    return card;
}

// 简单 toast 提示（无依赖）
function flashToast(msg) {
    let t = document.getElementById('mssyt-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'mssyt-toast';
        t.className = 'mssyt-toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(flashToast._timer);
    flashToast._timer = setTimeout(() => t.classList.remove('show'), 2400);
}

// 复制文案到剪贴板（带降级方案）
function copyTextToClipboard(text, btn) {
    const done = () => {
        if (!btn) return;
        const old = btn.textContent;
        btn.textContent = '✅ 已复制';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = old;
            btn.disabled = false;
        }, 1500);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
        fallbackCopy(text, done);
    }
}

function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (_) {}
    document.body.removeChild(ta);
    if (cb) cb();
}

/**
 * 一键"复制 + 跳转发布页"
 *  · 必须在用户手势事件内调用（如 button click handler 同步上下文）
 *  · 顺序很关键：先 window.open（同步、不被弹窗拦截），再异步写剪贴板
 *    若顺序反过来，写剪贴板的 promise 还没 resolve 用户已被新窗口抢焦点，
 *    部分浏览器会取消剪贴板写入。
 *  · platformLabel 仅用于 toast 提示文案
 */
function copyAndOpen(text, url, btn, platformLabel) {
    // 1) 先打开新窗口（同步触发）
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    const blocked = !win; // 如果浏览器拦截了弹窗，给用户一个降级提示

    // 2) 按钮反馈
    if (btn) {
        const old = btn.textContent;
        btn.textContent = '✅ 已复制并跳转';
        btn.disabled = true;
        setTimeout(() => {
            btn.textContent = old;
            btn.disabled = false;
        }, 1800);
    }

    // 3) 写剪贴板（异步）
    const onOk = () => {
        flashToast(
            blocked
                ? `✅ 文案已复制。新窗口被拦截了，请手动打开${platformLabel || '发布页'}后粘贴`
                : `✅ 文案已复制！切到刚打开的${platformLabel || '发布页'}标签页，按 Ctrl+V / 长按粘贴即可`
        );
    };
    const onFail = () => {
        // 走降级方案再发 toast
        fallbackCopy(text, onOk);
    };

    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(onOk).catch(onFail);
    } else {
        onFail();
    }
}

// 表单提交：生成各平台卡片 + 社交平台爆文卡片（不再伪装"自动提交"）
form.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = getFormData();
    if (!validateForm(formData)) {
        alert('请填写所有必填项并至少选择一个 AI 平台。');
        return;
    }

    // 提交即视为草稿"已用",清除草稿提示（数据本身保留以便再次编辑）
    if (draftTip) draftTip.style.display = 'none';

    // 显示结果区
    resultSection.style.display = 'block';
    platformCards.innerHTML = '';
    summaryContent.innerHTML = '';
    if (socialCards) socialCards.innerHTML = '';

    // 默认切回 AI 平台 tab
    document.querySelectorAll('.tab-btn').forEach((b) =>
        b.classList.toggle('active', b.dataset.tab === 'platforms')
    );
    document.querySelectorAll('.tab-pane').forEach((p) =>
        p.classList.toggle('active', p.dataset.pane === 'platforms')
    );

    resultSection.scrollIntoView({ behavior: 'smooth' });

    // 为每个选中的 AI 平台生成一张卡片
    formData.platforms.forEach((platformId) => {
        const card = createPlatformCard(platformId, formData);
        if (card) platformCards.appendChild(card);
    });

    // 渲染社交平台爆文卡片（只渲染勾选的）
    if (socialCards) {
        const selectedSocials = formData.socials || [];
        SOCIAL_TEMPLATES
            .filter((tpl) => selectedSocials.includes(tpl.id))
            .forEach((tpl) => {
                socialCards.appendChild(createSocialCard(tpl, formData));
            });
        if (selectedSocials.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'social-empty';
            empty.textContent = '你本次没有勾选任何社交 / 本地生活平台。如需要发布小红书 / 抖音等文案，请返回表单勾选后重新生成。';
            socialCards.appendChild(empty);
        }
    }

    // 通用文案 + 通用复制按钮 + 重置按钮
    const universalText = generateSubmissionText(formData);

    const summary = document.createElement('div');
    summary.innerHTML = `
        <h3 class="summary-title">📌 下一步操作</h3>
        <ol class="summary-steps">
            <li>对每个平台点击"<strong>复制文案</strong>"，再点"<strong>打开官方入口</strong>"。</li>
            <li>在平台 APP / 网页里按提示路径找到反馈/内容建议入口。</li>
            <li>粘贴文案并提交，记录提交时间。</li>
            <li>1–4 周后查看反馈；可同时去 <strong>百度商家中心 / 高德/腾讯地图</strong> 标注民宿，对国内 AI 间接生效更稳。</li>
        </ol>

        <div class="universal-text-box">
            <div class="universal-text-head">
                <strong>📝 通用版文案（备份）</strong>
                <button type="button" class="btn-secondary btn-copy-universal">📋 复制通用文案</button>
            </div>
            <pre class="universal-text-pre"></pre>
        </div>

        <div class="reset-row">
            <button type="button" class="btn-secondary btn-reset">🔄 重新填写</button>
        </div>
    `;
    summary.querySelector('.universal-text-pre').textContent = universalText;
    summary.querySelector('.btn-copy-universal').addEventListener('click', (ev) => {
        copyTextToClipboard(universalText, ev.currentTarget);
    });
    summary.querySelector('.btn-reset').addEventListener('click', () => location.reload());
    summaryContent.appendChild(summary);
});

// 页面加载：恢复草稿、刷新记录数
window.addEventListener('load', () => {
    console.log('民宿 AI 平台提交助手已加载');
    console.log('说明：本工具不会自动推送到任何平台，仅生成文案 + 提供官方反馈入口跳转。');
    initThemeToggle();
    initHeaderMenu();
    initStepNav();
    initStickyGenerate();
    initProfilesUI();
    loadDraftIntoForm();
    updateRecordsBadge();
    refreshAiStatusText();
    initDescPolish();
});
