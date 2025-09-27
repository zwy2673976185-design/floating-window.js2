// floating-window.js - 优化版正方形悬浮窗模块（东方淮竹原图版）
(function() {
    // 防止重复注入
    if (window.floatingWindowInjected) return;
    window.floatingWindowInjected = true;

    // 1. 配置项集中管理（便于后续修改，避免硬编码）
    const config = {
        floatBtnSize: 60, // 悬浮球尺寸（px）
        huaiZhuImgUrl: 'https://i.imgs.ovh/2025/09/28/75fraO.jpeg', // 东方淮竹原图链接
        backendUrl: 'https://resource-push-server-zwy.onrender.com', // 服务器地址
        pollInterval: 3000, // 轮询间隔（ms）
        safeMargin: 20, // 屏幕安全边距（px）
        defaultSafeBottom: 20 // 底部安全区默认值（px）
    };

    // 2. 动态创建核心样式（适配配置项，加图片加载兜底）
    function createStyle() {
        const style = document.createElement('style');
        style.textContent = `
            /* 正方形东方淮竹悬浮球 */
            .float-btn {
                position: fixed;
                z-index: 1002;
                width: ${config.floatBtnSize}px; 
                height: ${config.floatBtnSize}px; 
                border-radius: 0; 
                border: 2px solid #fff; 
                box-shadow: 0 3px 15px rgba(0, 0, 0, 0.3); 
                cursor: pointer;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
                transition: transform 0.2s ease, box-shadow 0.2s ease;
                /* 原图背景+加载失败兜底 */
                background-image: url(${config.huaiZhuImgUrl});
                background-color: #f0f0f0; /* 图片加载失败时显示灰色背景 */
                background-size: cover; 
                background-position: center; 
                background-repeat: no-repeat;
                padding: 0; 
                margin: 0;
            }
            .float-btn:active {
                transform: scale(0.95);
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
            }

            /* 悬浮窗口样式 */
            .float-window {
                position: fixed;
                z-index: 1001;
                width: calc(100% - ${config.safeMargin * 2}px); 
                max-width: 320px;
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

            .window-header {
                padding: 15px;
                background: #2563eb;
                color: white;
                font-size: 16px;
                font-weight: 500;
                display: flex;
                justify-content: space-between;
                align-items: center;
                cursor: move;
                -webkit-tap-highlight-color: transparent;
            }

            .window-close {
                background: transparent;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                -webkit-tap-highlight-color: transparent;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0;
            }

            .history-list {
                padding: 10px;
                max-height: 330px;
                overflow-y: auto;
                -webkit-overflow-scrolling: touch;
            }

            .history-item {
                padding: 12px;
                border-bottom: 1px solid #eee;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            .history-item:last-child {
                border-bottom: none;
            }

            .item-info {
                flex: 1;
                margin-right: 10px;
            }

            .item-filename {
                font-size: 14px;
                color: #333;
                margin-bottom: 4px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .item-time {
                font-size: 12px;
                color: #999;
            }

            .item-download {
                padding: 6px 12px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                white-space: nowrap;
                -webkit-tap-highlight-color: transparent;
                transition: background-color 0.2s ease;
            }
            .item-download:hover {
                background: #1d4ed8;
            }
        `;
        document.head.appendChild(style);
    }

    // 3. 创建悬浮元素结构（带唯一ID，便于定位）
    function createElements() {
        // 悬浮球
        const floatBtn = document.createElement('button');
        floatBtn.className = 'float-btn';
        floatBtn.id = 'floatBtn';
        document.body.appendChild(floatBtn);

        // 悬浮窗口
        const floatWindow = document.createElement('div');
        floatWindow.className = 'float-window';
        floatWindow.id = 'floatWindow';
        floatWindow.innerHTML = `
            <div class="window-header" id="windowHeader">
                推送历史记录
                <button class="window-close" id="closeWindow">×</button>
            </div>
            <div class="history-list" id="historyList">
                <div class="history-item">
                    <div class="item-info">
                        <div class="item-filename">暂无推送记录</div>
                        <div class="item-time">-</div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(floatWindow);

        return { floatBtn, floatWindow };
    }

    // 4. 工具函数（抽离通用逻辑）
    const utils = {
        // 格式化时间（统一格式：2024-09-30 14:59）
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
        // 计算安全区底部距离（容错处理）
        getSafeBottom: function() {
            const bodyStyle = getComputedStyle(document.body);
            const paddingBottom = parseFloat(bodyStyle.paddingBottom);
            return isNaN(paddingBottom) ? config.defaultSafeBottom : paddingBottom;
        }
    };

    // 5. 核心功能初始化（修复拖拽、优化轮询）
    function initFunctions(elements) {
        const { floatBtn, floatWindow } = elements;
        const closeWindow = document.getElementById('closeWindow');
        const historyList = document.getElementById('historyList');
        const windowHeader = document.getElementById('windowHeader');
        const BACKEND_URL = config.backendUrl;

        // 状态变量
        let localLastUpdate = '';
        let pushHistory = [];
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
        let pollTimer = null; // 轮询计时器（用于后台暂停）

        // 初始化悬浮球位置（适配安全区）
        function initBtnPosition() {
            const windowWidth = window.innerWidth;
            const windowHeight = window.innerHeight;
            const safeBottom = utils.getSafeBottom();
            const btnSize = config.floatBtnSize;
            // 右下角定位（避开安全区和边距）
            floatBtn.style.left = `${windowWidth - btnSize - config.safeMargin}px`;
            floatBtn.style.top = `${windowHeight - btnSize - safeBottom - config.safeMargin}px`;
            floatBtn.style.bottom = 'auto'; // 清除冲突定位
            floatBtn.style.right = 'auto';
        }

        // 下载文件（闭包内函数，避免全局污染）
        function downloadFile(downloadUrl) {
            if (!downloadUrl) {
                alert('下载链接无效，请稍后重试');
                return;
            }
            try {
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.target = '_blank';
                a.click();
            } catch (err) {
                console.error('下载失败：', err);
                alert('下载功能异常，请手动访问链接');
            }
        }

        // 渲染历史记录列表
        function renderHistoryList() {
            if (pushHistory.length === 0) {
                historyList.innerHTML = `
                    <div class="history-item">
                        <div class="item-info">
                            <div class="item-filename">暂无推送记录</div>
                            <div class="item-time">-</div>
                        </div>
                    </div>
                `;
                return;
            }
            let html = '';
            pushHistory.forEach(item => {
                // 用data-url存储链接，通过事件委托触发下载
                html += `
                    <div class="history-item">
                        <div class="item-info">
                            <div class="item-filename">${item.filename}</div>
                            <div class="item-time">${item.time}</div>
                        </div>
                        <button class="item-download" data-url="${item.downloadUrl}">下载</button>
                    </div>
                `;
            });
            historyList.innerHTML = html;
        }

        // 检查服务器最新资源
        async function checkLatestResource() {
            try {
                const res = await fetch(`${BACKEND_URL}/getLatest`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    credentials: 'omit',
                    timeout: 5000 // 超时时间5秒
                });
                if (!res.ok) throw new Error(`服务器返回错误：${res.status}`);
                
                const data = await res.json();
                if (data.lastUpdate && data.lastUpdate !== localLastUpdate && data.filename) {
                    localLastUpdate = data.lastUpdate;
                    pushHistory.unshift({
                        filename: data.filename,
                        time: utils.formatTime(data.lastUpdate),
                        downloadUrl: data.downloadUrl || ''
                    });
                    renderHistoryList();
                }
            } catch (err) {
                console.log('资源查询失败：', err.message);
                // 仅首次失败提示，避免频繁弹窗
                if (pushHistory.length === 0) {
                    historyList.innerHTML = `
                        <div class="history-item">
                            <div class="item-info">
                                <div class="item-filename">服务器连接中...</div>
                                <div class="item-time">${new Date().toLocaleTimeString()}</div>
                            </div>
                        </div>
                    `;
                }
            }
        }

        // 轮询控制（页面后台时暂停）
        function startPoll() {
            if (!pollTimer) {
                pollTimer = setInterval(checkLatestResource, config.pollInterval);
                checkLatestResource(); // 初始化时立即查询一次
            }
        }
        function stopPoll() {
            if (pollTimer) {
                clearInterval(pollTimer);
                pollTimer = null;
            }
        }

        // 1. 悬浮球点击交互
        floatBtn.addEventListener('click', () => {
            if (!btnIsDragging) {
                floatWindow.classList.toggle('active');
                if (floatWindow.classList.contains('active')) {
                    const btnRect = floatBtn.getBoundingClientRect();
                    const winWidth = floatWindow.offsetWidth;
                    const winHeight = floatWindow.offsetHeight;
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;

                    // 弹窗定位（优先悬浮球上方，超出则调整）
                    let winLeft = btnRect.left;
                    let winTop = btnRect.top - winHeight - 10;

                    // 左边界调整
                    if (winLeft < config.safeMargin) winLeft = config.safeMargin;
                    // 右边界调整
                    if (winLeft + winWidth > windowWidth - config.safeMargin) {
                        winLeft = windowWidth - winWidth - config.safeMargin;
                    }
                    // 上边界调整
                    if (winTop < config.safeMargin) winTop = config.safeMargin;
                    // 下边界调整
                    if (winTop + winHeight > windowHeight - utils.getSafeBottom() - config.safeMargin) {
                        winTop = btnRect.bottom + 10;
                    }

                    floatWindow.style.left = `${winLeft}px`;
                    floatWindow.style.top = `${winTop}px`;
                }
            }
        });

        // 2. 关闭窗口
        closeWindow.addEventListener('click', () => {
            floatWindow.classList.remove('active');
        });

        // 3. 悬浮球拖拽（修复passive问题，支持移动端顺滑拖拽）
        floatBtn.addEventListener('touchstart', (e) => {
            btnDragStart = Date.now();
            const touch = e.touches[0];
            btnStartX = touch.clientX;
            btnStartY = touch.clientY;
            const btnRect = floatBtn.getBoundingClientRect();
            btnOffsetX = btnRect.left;
            btnOffsetY = btnRect.top;
            btnIsDragging = false;
        }, { passive: true }); // touchstart可passive，避免300ms延迟

        floatBtn.addEventListener('touchmove', (e) => {
            const touch = e.touches[0];
            const moveX = Math.abs(touch.clientX - btnStartX);
            const moveY = Math.abs(touch.clientY - btnStartY);

            // 判定拖拽：移动>5px或按住>150ms
            if (moveX > 5 || moveY > 5 || Date.now() - btnDragStart > 150) {
                btnIsDragging = true;
                // 计算新位置（基于视口坐标，避免漂移）
                const newLeft = btnOffsetX + (touch.clientX - btnStartX);
                const newTop = btnOffsetY + (touch.clientY - btnStartY);
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const btnSize = config.floatBtnSize;
                const safeBottom = utils.getSafeBottom();

                // 边界限制（不超出屏幕安全区）
                const boundedLeft = Math.max(config.safeMargin, Math.min(newLeft, windowWidth - btnSize - config.safeMargin));
                const boundedTop = Math.max(config.safeMargin, Math.min(newTop, windowHeight - btnSize - safeBottom - config.safeMargin));

                floatBtn.style.left = `${boundedLeft}px`;
                floatBtn.style.top = `${boundedTop}px`;
            }
        }, { passive: false }); // 关键修复：touchmove设为false，允许preventDefault

        // 4. 悬浮窗拖拽
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
                const windowWidth = window.innerWidth;
                const windowHeight = window.innerHeight;
                const winWidth = floatWindow.offsetWidth;
                const winHeight = floatWindow.offsetHeight;
                const safeBottom = utils.getSafeBottom();

                // 窗口边界限制
                const boundedLeft = Math.max(config.safeMargin, Math.min(newLeft, windowWidth - winWidth - config.safeMargin));
                const boundedTop = Math.max(config.safeMargin, Math.min(newTop, windowHeight - winHeight - safeBottom - config.safeMargin));

                floatWindow.style.left = `${boundedLeft}px`;
                floatWindow.style.top = `${boundedTop}px`;
                floatWindow.style.transform = 'none'; // 清除居中transform冲突
            }
        }, { passive: false }); // 同修复：允许preventDefault

        // 5. 下载按钮事件委托（替代全局函数）
        floatWindow.addEventListener('click', (e) => {
            if (e.target.classList.contains('item-download')) {
                const downloadUrl = e.target.dataset.url;
                downloadFile(downloadUrl);
            }
        });

        // 6. 页面可见性监听（暂停/恢复轮询）
        document.addEventListener('visibilitychange', () => {
            document.hidden ? stopPoll() : startPoll();
        });

        // 初始化执行
        initBtnPosition();
        window.addEventListener('load', initBtnPosition);
        window.addEventListener('resize', initBtnPosition); // 窗口大小变化重定位
        startPoll(); // 启动轮询
        renderHistoryList(); // 初始渲染列表
    }

    // 对外暴露初始化函数（供外部调用）
    window.initFloatingWindow = function() {
        createStyle();
        const elements = createElements();
        initFunctions(elements);
        console.log('东方淮竹悬浮窗（优化版）初始化完成');
    };
})();
