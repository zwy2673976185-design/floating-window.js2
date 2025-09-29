// floatWindow.js - 优化显示+头部厚度
(function() {
    if (window.floatingWindowInjected) return;
    window.floatingWindowInjected = true;

    let styleElement = null;
    let pollTimer = null;

    const config = {
        floatBtnSize: 60,
        huaiZhuImgUrl: 'https://i.imgs.ovh/2025/09/28/75fraO.jpeg',
        safeMargin: 20,
        defaultSafeBottom: 20,
        floatBtnZIndex: 1002,
        floatWindowZIndex: 1001,
        windowWidth: 280,
        windowHeight: 250, // 保持高度，通过调整头部和内容区布局优化显示
        btnActiveScale: 0.95,
    };

    function createStyle() {
        if (styleElement && document.head.contains(styleElement)) {
            document.head.removeChild(styleElement);
        }
        styleElement = document.createElement('style');
        styleElement.textContent = `
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
                background-color: #f0f0f0;
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                padding: 0;
                margin: 0;
                border: none;
            }
            .float-btn:active {
                transform: scale(${config.btnActiveScale});
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
            }

            .float-window {
                position: fixed;
                z-index: ${config.floatWindowZIndex};
                width: ${config.windowWidth}px;
                height: ${config.windowHeight}px;
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

            /* 蓝色头部优化：减少padding，降低厚度 */
            .window-header {
                padding: 8px 15px; /* 原12px改为8px，降低头部高度 */
                background: #2563eb;
                color: white;
                font-size: 14px; /* 原15px改为14px，适配高度 */
                font-weight: 500;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                -webkit-tap-highlight-color: transparent;
                height: 36px; /* 原42px改为36px，头部更薄 */
            }

            .modal-back {
                background: transparent;
                border: none;
                color: white;
                font-size: 14px; /* 同步字体大小 */
                cursor: pointer;
                padding: 3px 6px;
                border-radius: 4px;
                transition: background 0.2s ease;
                display: none;
                -webkit-tap-highlight-color: transparent;
            }
            .modal-back:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            /* 内容区优化：增加可用高度，调整字体 */
            .func-buttons {
                padding: 8px; /* 原10px改为8px，节省空间 */
                display: flex;
                flex-direction: column;
                gap: 8px; /* 原10px改为8px，按钮间距缩小 */
                max-height: calc(${config.windowHeight}px - 36px); /* 头部改为36px，内容区更高 */
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }
            .func-btn {
                padding: 8px 10px; /* 原10px 12px改为8px 10px，按钮更紧凑 */
                border: 1px solid #eee;
                border-radius: 6px;
                background: #f8f9fa;
                font-size: 12px; /* 原13px改为12px，适配空间 */
                color: #333;
                text-align: left;
                cursor: pointer;
                transition: background 0.2s ease, border-color 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: space-between;
                -webkit-tap-highlight-color: transparent;
                border: none;
            }
            .func-btn:hover, .func-btn:active {
                background: #f1f3f5;
                border-color: #ddd;
            }
            .btn-icon {
                width: 16px; /* 原18px改为16px，图标缩小 */
                height: 16px;
                opacity: 0.7;
            }

            .content-panel {
                padding: 8px; /* 原10px改为8px */
                max-height: calc(${config.windowHeight}px - 36px); /* 头部改为36px */
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
                display: none;
            }
            .content-panel.active {
                display: block;
            }

            .user-name {
                font-size: 14px; /* 原15px改为14px */
                font-weight: 600;
                color: #333;
                margin-bottom: 5px; /* 原6px改为5px */
            }
            .user-desc {
                font-size: 11px; /* 原12px改为11px */
                color: #666;
                line-height: 1.4; /* 原1.5改为1.4，更紧凑 */
            }
            .notice-item {
                font-size: 11px; /* 原12px改为11px */
                color: #333;
                margin-bottom: 8px; /* 原10px改为8px */
                line-height: 1.4;
                padding-bottom: 8px; /* 原10px改为8px */
                border-bottom: 1px solid #eee;
            }
            .notice-item:last-child {
                border-bottom: none;
                margin-bottom: 2px; /* 原3px改为2px */
                padding-bottom: 0;
            }
            .notice-title {
                font-weight: 500;
                margin-bottom: 3px; /* 原3px保持 */
                color: #2563eb;
            }
            .notice-time {
                font-size: 9px; /* 原10px改为9px */
                color: #999;
                margin-bottom: 4px; /* 原5px改为4px */
            }
            .empty-tip {
                font-size: 11px; /* 原12px改为11px */
                color: #999;
                text-align: center;
                padding: 12px 0; /* 原15px改为12px */
                line-height: 1.4;
            }
        `;
        document.head.appendChild(styleElement);
    }

    // 以下createElements、utils、initFunctions逻辑与之前完全一致，无需修改
    function createElements() {
        const floatBtn = document.createElement('button');
        floatBtn.className = 'float-btn';
        floatBtn.id = 'floatBtn';
        document.body.appendChild(floatBtn);

        const floatWindow = document.createElement('div');
        floatWindow.className = 'float-window';
        floatWindow.id = 'floatWindow';
        floatWindow.innerHTML = `
            <div class="window-header" id="windowHeader">
                功能面板
                <button class="modal-back" id="modalBack">返回</button>
            </div>
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

    const utils = {
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
        getSafeBottom: function() {
            const bodyStyle = getComputedStyle(document.body);
            const paddingBottom = parseFloat(bodyStyle.paddingBottom);
            return isNaN(paddingBottom) ? config.defaultSafeBottom : paddingBottom;
        },
        checkWindowBound: function(left, top) {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const safeBottom = utils.getSafeBottom();
            const boundedLeft = Math.max(config.safeMargin, Math.min(left, windowWidth - config.windowWidth - config.safeMargin));
            const boundedTop = Math.max(config.safeMargin, Math.min(top, windowHeight - config.windowHeight - safeBottom - config.safeMargin));
            return { left: boundedLeft, top: boundedTop };
        },
        getDefaultWindowPos: function() {
            const windowWidth = document.documentElement.clientWidth;
            const windowHeight = document.documentElement.clientHeight;
            const left = (windowWidth - config.windowWidth) / 2;
            const top = (windowHeight - config.windowHeight) / 2;
            return utils.checkWindowBound(left, top);
        }
    };

    function initFunctions(elements) {
        const { floatBtn, floatWindow } = elements;
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
        let currentWindowPos = utils.getDefaultWindowPos();

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

        function positionWindow() {
            const boundedPos = utils.checkWindowBound(currentWindowPos.left, currentWindowPos.top);
            currentWindowPos = boundedPos;
            floatWindow.style.left = `${boundedPos.left}px`;
            floatWindow.style.top = `${boundedPos.top}px`;
            floatWindow.style.transform = 'none';
        }

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

        function backToMainPanel() {
            funcButtons.style.display = 'flex';
            panelMy.classList.remove('active');
            panelNotice.classList.remove('active');
            panelSetting.classList.remove('active');
            modalBack.style.display = 'none';
            isInMainPanel = true;
        }

        floatBtn.addEventListener('click', () => {
            if (!btnIsDragging) {
                floatWindow.classList.toggle('active');
                if (floatWindow.classList.contains('active')) positionWindow();
            }
        });

        modalBack.addEventListener('click', backToMainPanel);

        btnMy.addEventListener('click', () => switchContentPanel('panelMy'));
        btnNotice.addEventListener('click', () => switchContentPanel('panelNotice'));
        btnContact.addEventListener('click', () => window.open('https://qzone.qq.com/2673976185', '_blank'));
        btnSetting.addEventListener('click', () => switchContentPanel('panelSetting'));

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

        windowHeader.addEventListener('touchstart', (e) => {
            if (!floatWindow.classList.contains('active')) return;
            winDragStart = Date.now();
            const touch = e.touches[0];
            winStartX = touch.clientX;
            winStartY = touch.clientY;
            const winRect = floatWindow.getBoundingClientRect();
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
                const newLeft = winOffsetX + (touch.clientX - winStartX);
                const newTop = winOffsetY + (touch.clientY - winStartY);
                const boundedPos = utils.checkWindowBound(newLeft, newTop);
                currentWindowPos = boundedPos;
                floatWindow.style.left = `${boundedPos.left}px`;
                floatWindow.style.top = `${boundedPos.top}px`;
            }
        }, { passive: false });

        window.addEventListener('load', () => {
            initBtnPosition();
            if (floatWindow.classList.contains('active')) {
                positionWindow();
            }
        });
        window.addEventListener('resize', () => {
            initBtnPosition();
            if (floatWindow.classList.contains('active')) {
                positionWindow();
            }
        });

        initBtnPosition();
        backToMainPanel();
    }

    window.initFloatingWindow = function() {
        try {
            createStyle();
            const elements = createElements();
            initFunctions(elements);
            console.log('悬浮窗优化完成（显示完整+头部变薄）');
        } catch (err) {
            console.error('悬浮窗加载失败：', err);
            alert('悬浮窗异常，请检查文件路径');
            window.destroyFloatingWindow?.();
        }
    };

    window.destroyFloatingWindow = function() {
        const floatBtn = document.getElementById('floatBtn');
        const floatWindow = document.getElementById('floatWindow');
        if (floatBtn) floatBtn.remove();
        if (floatWindow) floatWindow.remove();
        if (styleElement) styleElement.remove();
        if (pollTimer) clearInterval(pollTimer);
        window.floatingWindowInjected = false;
    };

    window.addEventListener('load', window.initFloatingWindow);
})();
