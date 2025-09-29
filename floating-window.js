// floatWindow.js - 提取自你的原代码（280×250固定尺寸+位置记忆）
(function() {
    // 防止重复注入
    if (window.floatingWindowInjected) return;
    window.floatingWindowInjected = true;

    let styleElement = null; // 存储style标签引用，避免重复创建
    let pollTimer = null; // 兼容原销毁逻辑，初始置空

    // 1. 配置项集中管理（保留你原有的280宽+250高）
    const config = {
        floatBtnSize: 60, // 悬浮球尺寸（px）
        huaiZhuImgUrl: 'https://i.imgs.ovh/2025/09/28/75fraO.jpeg', // 东方淮竹原图链接
        safeMargin: 20, // 屏幕安全边距（px）
        defaultSafeBottom: 20, // 底部安全区默认值（px）
        floatBtnZIndex: 1002, // 悬浮球层级（高于白板）
        floatWindowZIndex: 1001, // 弹窗层级（高于白板）
        windowWidth: 280, // 弹窗宽度（px）
        windowHeight: 250, // 弹窗高度（px，保留你原有的数值）
        btnActiveScale: 0.95, // 按钮按下缩放比例
    };

    // 2. 动态创建核心样式（完全保留你的原样式）
    function createStyle() {
        // 若已有样式，先移除旧的避免冗余
        if (styleElement && document.head.contains(styleElement)) {
            document.head.removeChild(styleElement);
        }
        styleElement = document.createElement('style');
        styleElement.textContent = `
            /* 正方形东方淮竹悬浮球（保留原样式） */
            .float-btn {
                position: fixed;
                z-index: ${config.floatBtnZIndex};
                width: ${config.floatBtnSize}px;
                height: ${config.floatBtnSize}px; 
                border-radius: 0; 
                border: 2px solid #fff; 
                box-shadow: 0 3px 15px rgba(0, 0, 0, 0.3); 
                cursor: pointer;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                background-image: url(${config.huaiZhuImgUrl});
                background-color: #f0f0f0; /* 图片加载失败兜底 */
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                padding: 0;
                margin: 0;
                border: none; /* 统一按钮样式 */
            }
            .float-btn:active {
                transform: scale(${config.btnActiveScale});
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
            }

            /* 悬浮窗口（280×250固定尺寸） */
            .float-window {
                position: fixed;
                z-index: ${config.floatWindowZIndex};
                width: ${config.windowWidth}px; /* 固定宽度 */
                height: ${config.windowHeight}px; /* 固定高度 */
                background: white;
                border-radius: 10px;
                box-shadow: 0 3px 15px rgba(0,0,0,0.2);
                overflow: hidden;
                display: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            .float-window.active {
                display: block;
                opacity: 1;
            }

            /* 弹窗头部（高度适配固定尺寸） */
            .window-header {
                padding: 12px 15px;
                background: #2563eb; /* 保留原头部配色 */
                color: white;
                font-size: 15px;
                font-weight: 500;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                -webkit-tap-highlight-color: transparent;
                height: 42px; /* 固定头部高度，方便内容区计算 */
            }

            /* 返回按钮（适配头部尺寸） */
            .modal-back {
                background: transparent;
                border: none;
                color: white;
                font-size: 15px;
                cursor: pointer;
                padding: 3px 6px;
                border-radius: 4px;
                transition: background 0.2s ease;
                display: none; /* 主页面默认隐藏 */
                -webkit-tap-highlight-color: transparent;
            }
            .modal-back:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            /* 功能按钮区域（适配280×250尺寸） */
            .func-buttons {
                padding: 10px;
                display: flex;
                flex-direction: column;
                gap: 10px; /* 按钮间距适配固定高度 */
                max-height: calc(${config.windowHeight}px - 42px); /* 减去头部42px */
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            .func-btn {
                padding: 10px 12px;
                border: 1px solid #eee;
                border-radius: 6px;
                background: #f8f9fa;
                font-size: 13px;
                color: #333;
                text-align: left;
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
                -webkit-tap-highlight-color: transparent;
                border: none; /* 统一按钮样式 */
            }
            .func-btn:hover, .func-btn:active {
                background: #f1f3f5;
                border-color: #ddd;
            }
            .btn-icon {
                width: 18px;
                height: 18px;
                opacity: 0.7;
            }

            /* 内容面板（适配280×250固定尺寸） */
            .content-panel {
                padding: 10px;
                max-height: calc(${config.windowHeight}px - 42px); /* 减去头部42px */
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                display: none; /* 默认隐藏 */
            }
            .content-panel.active {
                display: block;
            }

            /* 面板内容样式（保留原样式） */
            .user-name {
                font-size: 15px;
                font-weight: 600;
                color: #333;
                margin-bottom: 6px;
            }
            .user-desc {
                font-size: 12px;
                color: #666;
                line-height: 1.5;
            }
            .notice-item {
                font-size: 12px;
                color: #333;
                margin-bottom: 10px;
                line-height: 1.5;
                padding-bottom: 10px;
                border-bottom: 1px solid #eee;
            }
            .notice-item:last-child {
                border-bottom: none;
                margin-bottom: 3px;
                padding-bottom: 0;
            }
            .notice-title {
                font-weight: 500;
                margin-bottom: 3px;
                color: #2563eb; /* 标题用头部同色 */
            }
            .notice-time {
                font-size: 10px;
                color: #999;
                margin-bottom: 5px;
            }
            .empty-tip {
                font-size: 12px;
                color: #999;
                text-align: center;
                padding: 15px 0;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // 3. 创建悬浮元素结构（完全保留你的原结构）
    function createElements() {
        // 悬浮球（保留原结构）
        const floatBtn = document.createElement('button');
        floatBtn.className = 'float-btn';
        floatBtn.id = 'floatBtn';
        document.body.appendChild(floatBtn);

        // 悬浮窗口（保留原功能内容）
        const floatWindow = document.createElement('div');
        floatWindow.className = 'float-window';
        floatWindow.id = 'floatWindow';
        floatWindow.innerHTML = `
            <div class="window-header" id="windowHeader">
                功能面板
                <button class="modal-back" id="modalBack">返回</button>
            </div>
            <!-- 1. 功能按钮主页面 -->
            <div class="func-buttons" id="funcButtons">
                <button class="func-btn" id="btnMy">
                    <span>我的</span>
                    <img src="https://img.icons8.com/ios-glyphs/30/666/user--v1.png" class="btn-icon" alt="我的">
                </button>
                <button class="func-btn" id="btnNotice">
                    <span>公告</span>
                    <img src="https://img.icons8.com/ios-glyphs/30/666/announcement--v1.png" class="btn-icon" alt="公告">
                </button>
                <button class="func-btn" id="btnContact">
                    <span>联系作者</span>
                    <img src="https://img.icons8.com/ios-glyphs/30/666/contact-card--v1.png" class="btn-icon" alt="联系作者">
                </button>
                <button class="func-btn" id="btnSetting">
                    <span>设置</span>
                    <img src="https://img.icons8.com/ios-glyphs/30/666/settings--v1.png" class="btn-icon" alt="设置">
                </button>
            </div>
            <!-- 2. 内容面板（默认隐藏） -->
            <div class="content-panel" id="panelMy">
                <div class="user-name">用一生找寻</div>
                <div class="user-desc">当前功能待后续开发，暂显示用户名<br>后续可添加头像、个人信息、功能开关等内容</div>
            </div>
            <div class="content-panel" id="panelNotice">
                <div class="notice-item">
                    <div class="notice-title">V1.0 功能更新公告</div>
                    <div class="notice-time">${utils.formatTime(new Date().toISOString())}</div>
                    <div>1. 新增“我的”“公告”“联系作者”“设置”4个功能按钮；<br>2. 悬浮球支持移动端顺滑拖拽，适配屏幕安全区；<br>3. 内容面板支持“返回主页面”，隐藏弹窗靠点击悬浮球。</div>
                </div>
                <div class="notice-item">
                    <div class="notice-title">功能预告</div>
                    <div class="notice-time">${utils.formatTime(new Date().toISOString())}</div>
                    <div>1. “我的”模块将新增个人信息编辑功能；<br>2. “设置”模块将支持悬浮球大小、弹窗位置自定义；<br>3. 后续将优化面板样式，增加更多实用功能。</div>
                </div>
            </div>
            <div class="content-panel" id="panelSetting">
                <div class="empty-tip">设置功能待开发<br>敬请期待后续更新～</div>
            </div>
        `;
        document.body.appendChild(floatWindow);

        return { floatBtn, floatWindow };
    }

    // 4. 工具函数（完全保留你的原逻辑）
    const utils = {
        // 格式化时间
        formatTime: function(dateStr) {
            try {
                const date = new Date(dateStr);
                return [
                    date.getFullYear(),
                    String(date.getMonth() + 1).padStart(2, '0'),
                    String(date.getDate()).padStart(2, '0')
                ].join('-') + ' ' + [
                    String(date.getHours()).padStart(2, '0'),
                    String(date.getMinutes()).padStart(2, '0')
                ].join(':');
            } catch (err) {
                return '时间格式错误';
            }
        },
        // 计算安全区底部距离
        getSafeBottom: function() {
            const bodyStyle = getComputedStyle(document.body);
            const paddingBottom = parseFloat(bodyStyle.paddingBottom);
            return isNaN(paddingBottom) ? config.defaultSafeBottom : paddingBottom;
        },
        // 检查弹窗位置是否超出屏幕，超出则修正
        checkWindowBound: function(left, top) {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const safeBottom = utils.getSafeBottom();
            // 修正水平边界（不超出左右安全边距）
            const boundedLeft = Math.max(config.safeMargin, Math.min(left, windowWidth - config.windowWidth - config.safeMargin));
            // 修正垂直边界（不超出上下安全边距）
            const boundedTop = Math.max(config.safeMargin, Math.min(top, windowHeight - config.windowHeight - safeBottom - config.safeMargin));
            return { left: boundedLeft, top: boundedTop };
        },
        // 计算弹窗默认居中位置（仅第一次初始化用）
        getDefaultWindowPos: function() {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const left = (windowWidth - config.windowWidth) / 2;
            const top = (windowHeight - config.windowHeight) / 2;
            // 确保默认位置在屏幕内
            return utils.checkWindowBound(left, top);
        }
    };

    // 5. 核心功能初始化（完全保留你的原逻辑，含位置记忆）
    function initFunctions(elements) {
        const { floatBtn, floatWindow } = elements;
        // DOM元素绑定（原逻辑不变）
        const modalBack = document.getElementById('modalBack');
        const windowHeader = document.getElementById('windowHeader');
        const funcButtons = document.getElementById('funcButtons');
        const btnMy = document.getElementById('btnMy');
        const btnNotice = document.getElementById('btnNotice');
        const btnContact = document.getElementById('btnContact');
        const btnSetting = document.getElementById('btnSetting');
        const panelMy = document.getElementById('panelMy');
        const panelNotice = document.getElementById('panelNotice');
        const panelSetting = document.getElementById('panelSetting');

        // 状态变量（新增：弹窗位置记忆变量）
        let btnIsDragging = false;
        let btnDragStart = 0;
        let btnStartX = 0;
        let btnStartY = 0;
        let btnOffsetX = 0;
        let btnOffsetY = 0;
        let winIsDragging = false;
        let winDragStart = 0;
        let winStartX = 0;
        let winStartY = 0;
        let winOffsetX = 0;
        let winOffsetY = 0;
        let isInMainPanel = true; 
        let lastActivePanel = null;
        // 关键：弹窗当前位置（记忆用），初始化为默认居中位置
        let currentWindowPos = utils.getDefaultWindowPos();

        // 1. 悬浮球初始化位置（原逻辑不变）
        function initBtnPosition() {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const safeBottom = utils.getSafeBottom();
            const btnSize = config.floatBtnSize;
            floatBtn.style.left = `${windowWidth - btnSize - config.safeMargin}px`;
            floatBtn.style.top = `${windowHeight - btnSize - safeBottom - config.safeMargin}px`;
            floatBtn.style.bottom = 'auto';
            floatBtn.style.right = 'auto';
        }

        // 2. 弹窗定位（基于记忆的currentWindowPos，不再每次居中）
        function positionWindow() {
            const boundedPos = utils.checkWindowBound(currentWindowPos.left, currentWindowPos.top);
            currentWindowPos = boundedPos;
            floatWindow.style.left = `${boundedPos.left}px`;
            floatWindow.style.top = `${boundedPos.top}px`;
            floatWindow.style.transform = 'none';
        }

        // 3. 切换内容面板（原逻辑不变）
        function switchContentPanel(targetPanelId) {
            funcButtons.style.display = 'none';
            panelMy.classList.remove('active');
            panelNotice.classList.remove('active');
            panelSetting.classList.remove('active');
            document.getElementById(targetPanelId).classList.add('active');
            modalBack.style.display = 'block';
            isInMainPanel = false;
            lastActivePanel = targetPanelId;
        }

        // 4. 返回主页面（原逻辑不变）
        function backToMainPanel() {
            funcButtons.style.display = 'flex';
            panelMy.classList.remove('active');
            panelNotice.classList.remove('active');
            panelSetting.classList.remove('active');
            modalBack.style.display = 'none';
            isInMainPanel = true;
        }

        // 5. 悬浮球点击（切换弹窗显示/隐藏，用记忆位置定位）
        floatBtn.addEventListener('click', () => {
            if (!btnIsDragging) {
                if (floatWindow.classList.contains('active')) {
                    // 隐藏弹窗：无需改变记忆位置
                    floatWindow.classList.remove('active');
                } else {
                    // 唤醒弹窗：用记忆的位置定位
                    floatWindow.classList.add('active');
                    positionWindow();
                }
            }
        });

        // 6. 返回按钮（原逻辑不变）
        modalBack.addEventListener('click', () => {
            backToMainPanel();
        });

        // 7. 功能按钮点击（原逻辑不变）
        btnMy.addEventListener('click', () => {
            switchContentPanel('panelMy');
        });
        btnNotice.addEventListener('click', () => {
            switchContentPanel('panelNotice');
        });
        btnContact.addEventListener('click', () => {
            window.open('https://qzone.qq.com/2673976185', '_blank');
        });
        btnSetting.addEventListener('click', () => {
            switchContentPanel('panelSetting');
        });

        // 8. 悬浮球拖拽（原逻辑不变）
        floatBtn.addEventListener('touchstart', (e) => {
            btnDragStart = Date.now();
            const touch = e.touches[0];
            btnStartX = touch.clientX;
            btnStartY = touch.clientY;
            const btnRect = floatBtn.getBoundingClientRect();
            btnOffsetX = btnRect.left;
            btnOffsetY = btnRect.top;
            btnIsDragging = false;
        }, { passive: true });

        floatBtn.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - btnStartX);
            const moveY = Math.abs(touch.clientY - btnStartY);

            if (moveX > 5 || moveY > 5 || Date.now() - btnDragStart > 150) {
                btnIsDragging = true;
                const newLeft = btnOffsetX + (touch.clientX - btnStartX);
                const newTop = btnOffsetY + (touch.clientY - btnStartY);
                const windowWidth = document.documentElement.clientWidth;
                const windowHeight = document.documentElement.clientHeight;
                const btnSize = config.floatBtnSize;
                const safeBottom = utils.getSafeBottom();

                const boundedLeft = Math.max(config.safeMargin, Math.min(newLeft, windowWidth - btnSize - config.safeMargin));
                const boundedTop = Math.max(config.safeMargin, Math.min(newTop, windowHeight - btnSize - safeBottom - config.safeMargin));

                floatBtn.style.left = `${boundedLeft}px`;
                floatBtn.style.top = `${boundedTop}px`;
            }
        }, { passive: false });

        // 9. 弹窗拖拽（核心：拖拽时实时更新记忆的currentWindowPos）
        windowHeader.addEventListener('touchstart', (e) => {
            if (!floatWindow.classList.contains('active')) return;
            winDragStart = Date.now();
            const touch = e.touches[0];
            winStartX = touch.clientX;
            winStartY = touch.clientY;
            const winRect = floatWindow.getBoundingClientRect();
            // 记录拖拽起始时的弹窗偏移量（不是窗口偏移，是弹窗自身位置）
            winOffsetX = winRect.left;
            winOffsetY = winRect.top;
            winIsDragging = false;
        }, { passive: true });

        windowHeader.addEventListener('touchmove', (e) => {
            if (!floatWindow.classList.contains('active')) return;
            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - winStartX);
            const moveY = Math.abs(touch.clientY - winStartY);

            if (moveX > 5 || moveY > 5 || Date.now() - winDragStart > 150) {
                winIsDragging = true;
                // 计算拖拽后的弹窗新位置
                const newLeft = winOffsetX + (touch.clientX - winStartX);
                const newTop = winOffsetY + (touch.clientY - winStartY);
                // 检查边界并更新记忆位置
                const boundedPos = utils.checkWindowBound(newLeft, newTop);
                currentWindowPos = boundedPos;
                // 实时设置弹窗位置（拖拽跟随）
                floatWindow.style.left = `${boundedPos.left}px`;
                floatWindow.style.top = `${boundedPos.top}px`;
                floatWindow.style.transform = 'none';
            }
        }, { passive: false });

        // 10. 页面resize监听（重新定位弹窗和悬浮球，保留记忆位置）
        window.addEventListener('load', () => {
            initBtnPosition();
            if (floatWindow.classList.contains('active')) {
                positionWindow();
            }
        });
        window.addEventListener('resize', () => {
            initBtnPosition();
            // 窗口缩放时，若弹窗显示则重新检查边界（不改变记忆位置，仅修正显示）
            if (floatWindow.classList.contains('active')) {
                positionWindow();
            }
        });

        // 初始化执行（原逻辑不变）
        initBtnPosition();
        backToMainPanel();
    }

    // 对外暴露初始化函数（原逻辑不变）
    window.initFloatingWindow = function() {
        try {
            createStyle();
            const elements = createElements();
            initFunctions(elements);
            console.log('280×250固定尺寸+位置记忆悬浮窗初始化完成');
        } catch (err) {
            console.error('悬浮窗初始化失败：', err);
            alert('悬浮窗加载异常，请刷新页面重试');
            window.destroyFloatingWindow?.();
        }
    };

    // 对外暴露销毁函数（原逻辑不变）
    window.destroyFloatingWindow = function() {
        const floatBtn = document.getElementById('floatBtn');
        const floatWindow = document.getElementById('floatWindow');
        if (floatBtn) floatBtn.remove();
        if (floatWindow) floatWindow.remove();
        if (styleElement) styleElement.remove();
        if (pollTimer) clearInterval(pollTimer);
        window.floatingWindowInjected = false;
    };

    // 页面加载后自动初始化悬浮窗
    window.addEventListener('load', window.initFloatingWindow);
})();
