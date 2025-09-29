(function() {
// 防止重复注入
if (window.floatingWindowInjected) return;
window.floatingWindowInjected = true;

let styleElement = null; // 存储style标签引用，避免重复创建
let pollTimer = null; // 兼容原销毁逻辑，初始置空

// 1. 配置项集中管理（保留原悬浮球样式，移除下载/轮询相关配置）
const config = {
floatBtnSize: 60, // 悬浮球尺寸（px）
huaiZhuImgUrl: 'https://i.imgs.ovh/2025/09/28/75fraO.jpeg', // 东方淮竹原图链接
safeMargin: 20, // 屏幕安全边距（px）
defaultSafeBottom: 20, // 底部安全区默认值（px）
floatBtnZIndex: 1002, // 悬浮球层级
floatWindowZIndex: 1001, // 弹窗层级
windowMaxHeight: 330, // 弹窗最大高度（px）
btnActiveScale: 0.95, // 按钮按下缩放比例
};

// 2. 动态创建核心样式（保留原悬浮球/弹窗样式，新增功能按钮/面板样式）
function createStyle() {
// 若已有样式，先移除旧的避免冗余
if (styleElement && document.head.contains(styleElement)) {
document.head.removeChild(styleElement);
}
styleElement = document.createElement('style');
styleElement.textContent = `
/* 正方形东方淮竹悬浮球（保留原样式） /
.float-btn {
position: fixed;
z-index: ${config.floatBtnZIndex};
width: ${config.floatBtnSize}px;
height: {config.floatBtnSize}px; 
border-radius: 0; 
border: 2px solid #fff; 
box-shadow: 0 3px 15px rgba(0, 0, 0, 0.3); 
cursor: pointer;
user-select: none;
-webkit-tap-highlight-color: transparent;
transition: transform 0.2s ease, box-shadow 0.2s ease;
background-image: url({config.huaiZhuImgUrl});
background-color: #f0f0f0; / 图片加载失败兜底 /
background-size: cover;
background-position: center;
background-repeat: no-repeat;
padding: 0;
margin: 0;
border: none; / 统一按钮样式 */
}
.float-btn:active {
transform: scale(${config.btnActiveScale});
box-shadow: 0 5px 20px rgba(0, 0, 0, 0.4);
}

/* 悬浮窗口（保留原弹窗框架，调整内容区样式） /
.float-window {
position: fixed;
z-index: ${config.floatWindowZIndex};
width: calc(100% - ${config.safeMargin * 2}px);
max-width: 320px; / 匹配原弹窗宽度，保持协调 */
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

/* 弹窗头部（保留拖拽，标题改功能面板，移除关闭按钮样式） /
.window-header {
padding: 15px;
background: #2563eb; / 保留原头部配色，保持风格统一 */
color: white;
font-size: 16px;
font-weight: 500;
display: flex;
justify-content: space-between;
align-items: center;
cursor: move;
-webkit-tap-highlight-color: transparent;
}

/* 返回按钮（仅内容面板显示，适配原头部风格） /
.modal-back {
background: transparent;
border: none;
color: white;
font-size: 16px;
cursor: pointer;
padding: 4px 8px;
border-radius: 4px;
transition: background 0.2s ease;
display: none; / 主页面默认隐藏 */
-webkit-tap-highlight-color: transparent;
}
.modal-back:hover {
background: rgba(255, 255, 255, 0.1);
}

/* 4个功能按钮区域（适配原弹窗尺寸，风格统一） /
.func-buttons {
padding: 20px;
display: flex;
flex-direction: column;
gap: 15px; / 按钮间距，避免拥挤 /
max-height: ${config.windowMaxHeight}px;
overflow-y: auto;
-webkit-overflow-scrolling: touch;
}
.func-btn {
padding: 14px 20px;
border: 1px solid #eee;
border-radius: 8px;
background: #f8f9fa;
font-size: 15px;
color: #333; / 适配原文字色，更协调 /
text-align: left;
cursor: pointer;
transition: background 0.2s ease, border-color 0.2s ease;
display: flex;
align-items: center;
justify-content: space-between;
-webkit-tap-highlight-color: transparent;
border: none; / 统一按钮样式 */
}
.func-btn:hover, .func-btn:active {
background: #f1f3f5;
border-color: #ddd;
}
.btn-icon {
width: 22px;
height: 22px;
opacity: 0.7;
}

/* 内容面板（“我的”“公告”“设置”，适配弹窗高度） /
.content-panel {
padding: 20px;
max-height: ${config.windowMaxHeight}px;
overflow-y: auto;
-webkit-overflow-scrolling: touch;
display: none; / 默认隐藏，点击按钮后显示 */
}
.content-panel.active {
display: block;
}

/* 面板内容样式（简洁，适配原弹窗风格） /
.user-name {
font-size: 18px;
font-weight: 600;
color: #333;
margin-bottom: 10px;
}
.user-desc {
font-size: 14px;
color: #666;
line-height: 1.6;
}
.notice-item {
font-size: 14px;
color: #333;
margin-bottom: 15px;
line-height: 1.6;
padding-bottom: 15px;
border-bottom: 1px solid #eee;
}
.notice-item:last-child {
border-bottom: none;
margin-bottom: 5px;
padding-bottom: 0;
}
.notice-title {
font-weight: 500;
margin-bottom: 5px;
color: #2563eb; / 标题用头部同色，突出层级 */
}
.notice-time {
font-size: 12px;
color: #999;
margin-bottom: 8px;
}
.empty-tip {
font-size: 14px;
color: #999;
text-align: center;
padding: 30px 0;
line-height: 1.6;
}
`;
document.head.appendChild(styleElement);
}

// 3. 创建悬浮元素结构（保留原ID，替换弹窗内容为功能按钮+面板）
function createElements() {
// 悬浮球（保留原结构，仅统一ID）
const floatBtn = document.createElement('button');
floatBtn.className = 'float-btn';
floatBtn.id = 'floatBtn';
document.body.appendChild(floatBtn);

// 悬浮窗口（替换内容：删除历史记录，加功能按钮+3个面板）
const floatWindow = document.createElement('div');
floatWindow.className = 'float-window';
floatWindow.id = 'floatWindow';
floatWindow.innerHTML = <div class="window-header" id="windowHeader"> 功能面板 <button class="modal-back" id="modalBack">返回</button> </div> <!-- 1. 功能按钮主页面 --> <div class="func-buttons" id="funcButtons"> <button class="func-btn" id="btnMy"> <span>我的</span> <img src="https://img.icons8.com/ios-glyphs/30/666/user--v1.png" class="btn-icon" alt="我的"> </button> <button class="func-btn" id="btnNotice"> <span>公告</span> <img src="https://img.icons8.com/ios-glyphs/30/666/announcement--v1.png" class="btn-icon" alt="公告"> </button> <button class="func-btn" id="btnContact"> <span>联系作者</span> <img src="https://img.icons8.com/ios-glyphs/30/666/contact-card--v1.png" class="btn-icon" alt="联系作者"> </button> <button class="func-btn" id="btnSetting"> <span>设置</span> <img src="https://img.icons8.com/ios-glyphs/30/666/settings--v1.png" class="btn-icon" alt="设置"> </button> </div> <!-- 2. 内容面板（默认隐藏） --> <div class="content-panel" id="panelMy"> <div class="user-name">用一生找寻</div> <div class="user-desc">当前功能待后续开发，暂显示用户名<br>后续可添加头像、个人信息、功能开关等内容</div> </div> <div class="content-panel" id="panelNotice"> <div class="notice-item"> <div class="notice-title">V1.0 功能更新公告</div> <div class="notice-time">${utils.formatTime(new Date().toISOString())}</div> <div>1. 新增“我的”“公告”“联系作者”“设置”4个功能按钮；<br>2. 悬浮球支持移动端顺滑拖拽，适配屏幕安全区；<br>3. 内容面板支持“返回主页面”，隐藏弹窗靠点击悬浮球。</div> </div> <div class="notice-item"> <div class="notice-title">功能预告</div> <div class="notice-time">${utils.formatTime(new Date().toISOString())}</div> <div>1. “我的”模块将新增个人信息编辑功能；<br>2. “设置”模块将支持悬浮球大小、弹窗位置自定义；<br>3. 后续将优化面板样式，增加更多实用功能。</div> </div> </div> <div class="content-panel" id="panelSetting"> <div class="empty-tip">设置功能待开发<br>敬请期待后续更新～</div> </div>;
document.body.appendChild(floatWindow);

return { floatBtn, floatWindow };
}

// 4. 工具函数（保留原有用的：时间格式化、安全区计算，移除XSS转义（静态内容无需））
const utils = {
// 格式化时间（统一格式：2024-09-30 14:59，公告中使用）
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
// 计算安全区底部距离（适配移动端，保留原逻辑）
getSafeBottom: function() {
const bodyStyle = getComputedStyle(document.body);
const paddingBottom = parseFloat(bodyStyle.paddingBottom);
return isNaN(paddingBottom) ? config.defaultSafeBottom : paddingBottom;
}
};

// 5. 核心功能初始化（保留原拖拽/定位，替换为功能按钮逻辑）
function initFunctions(elements) {
const { floatBtn, floatWindow } = elements;
// DOM元素：绑定新增的功能按钮、面板、返回按钮
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

// 状态变量（控制面板显示/隐藏、拖拽状态）
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
let isInMainPanel = true; // 是否在功能主页面（默认true）
let lastActivePanel = null; // 上次激活的内容面板（记忆状态）

// 1. 悬浮球初始化位置（保留原逻辑，适配安全区）
function initBtnPosition() {
const windowWidth = document.documentElement.clientWidth;
const windowHeight = document.documentElement.clientHeight;
const safeBottom = utils.getSafeBottom();
const btnSize = config.floatBtnSize;
// 右下角定位（避开安全区和边距，保留原位置逻辑）
floatBtn.style.left = ${windowWidth - btnSize - config.safeMargin}px;
floatBtn.style.top = ${windowHeight - btnSize - safeBottom - config.safeMargin}px;
floatBtn.style.bottom = 'auto';
floatBtn.style.right = 'auto';
}

// 2. 切换内容面板（通用函数，避免重复代码）
function switchContentPanel(targetPanelId) {
// 隐藏所有面板和主按钮，显示目标面板
funcButtons.style.display = 'none';
panelMy.classList.remove('active');
panelNotice.classList.remove('active');
panelSetting.classList.remove('active');
// 显示目标面板和返回按钮
document.getElementById(targetPanelId).classList.add('active');
modalBack.style.display = 'block';
// 更新状态变量
isInMainPanel = false;
lastActivePanel = targetPanelId;
}

// 3. 返回主页面（通用逻辑，隐藏面板，显示按钮）
function backToMainPanel() {
funcButtons.style.display = 'flex';
panelMy.classList.remove('active');
panelNotice.classList.remove('active');
panelSetting.classList.remove('active');
modalBack.style.display = 'none';
isInMainPanel = true;
}

// 4. 悬浮球点击：切换弹窗显示/隐藏（核心逻辑，保留记忆状态）
floatBtn.addEventListener('click', () => {
if (!btnIsDragging) {
if (floatWindow.classList.contains('active')) {
// 弹窗已显示 → 隐藏（仅靠悬浮球，无其他关闭方式）
floatWindow.classList.remove('active');
} else {
// 弹窗未显示 → 打开，根据状态显示对应内容
floatWindow.classList.add('active');
// 定位弹窗（保留原逻辑，优先悬浮球上方，超出则调整）
const btnRect = floatBtn.getBoundingClientRect();
const winWidth = floatWindow.offsetWidth;
const winHeight = floatWindow.offsetHeight;
const windowWidth = document.documentElement.clientWidth;
const windowHeight = document.documentElement.clientHeight;
const safeBottom = utils.getSafeBottom();

let winLeft = btnRect.left;
let winTop = btnRect.top - winHeight - 10;

// 边界调整（避免弹窗超出屏幕）
if (winLeft < config.safeMargin) winLeft = config.safeMargin;
if (winLeft + winWidth > windowWidth - config.safeMargin) {
winLeft = windowWidth - winWidth - config.safeMargin;
}
if (winTop < config.safeMargin) winTop = config.safeMargin;
if (winTop + winHeight > windowHeight - safeBottom - config.safeMargin) {
winTop = btnRect.bottom + 10;
}

floatWindow.style.left = ${winLeft}px;
floatWindow.style.top = ${winTop}px;
floatWindow.style.transform = 'none';

// 根据状态显示主按钮/上次面板
if (isInMainPanel || !lastActivePanel) {
backToMainPanel(); // 主页面/无历史 → 显示按钮
} else {
switchContentPanel(lastActivePanel); // 有历史 → 显示上次面板
}
}
}
});

// 5. 返回按钮：仅从内容面板回到主页面（无关闭功能）
modalBack.addEventListener('click', () => {
backToMainPanel();
});

// 6. 功能按钮点击事件（绑定对应面板）
// 按钮1：我的
btnMy.addEventListener('click', () => {
switchContentPanel('panelMy');
});
// 按钮2：公告
btnNotice.addEventListener('click', () => {
switchContentPanel('panelNotice');
});
// 按钮3：联系作者（跳转QQ主页，新窗口打开）
btnContact.addEventListener('click', () => {
window.open('https://qzone.qq.com/2673976185', '_blank');
});
// 按钮4：设置
btnSetting.addEventListener('click', () => {
switchContentPanel('panelSetting');
});

// 7. 悬浮球拖拽（保留原逻辑，修复passive，适配移动端）
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

// 边界限制（悬浮球不超出屏幕）
const boundedLeft = Math.max(config.safeMargin, Math.min(newLeft, windowWidth - btnSize - config.safeMargin));
const boundedTop = Math.max(config.safeMargin, Math.min(newTop, windowHeight - btnSize - safeBottom - config.safeMargin));

floatBtn.style.left = ${boundedLeft}px;
floatBtn.style.top = ${boundedTop}px;
}
}, { passive: false });

// 8. 弹窗拖拽（保留原逻辑，仅在弹窗显示时生效）
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
const windowWidth = document.documentElement.clientWidth;
const windowHeight = document.documentElement.clientHeight;
const winWidth = floatWindow.offsetWidth;
const winHeight = floatWindow.offsetHeight;
const safeBottom = utils.getSafeBottom();

// 窗口边界限制（弹窗不超出屏幕）
const boundedLeft = Math.max(config.safeMargin, Math.min(newLeft, windowWidth - winWidth - config.safeMargin));
const boundedTop = Math.max(config.safeMargin, Math.min(newTop, windowHeight - winHeight - safeBottom - config.safeMargin));

floatWindow.style.left = ${boundedLeft}px;
floatWindow.style.top = ${boundedTop}px;
floatWindow.style.transform = 'none';
}
}, { passive: false });

// 9. 页面resize监听（悬浮球位置重新计算）
window.addEventListener('load', initBtnPosition);
window.addEventListener('resize', initBtnPosition);

// 初始化执行（定位悬浮球，默认显示主页面）
initBtnPosition();
backToMainPanel();
}

// 对外暴露初始化函数（保留原try-catch容错，确保稳定）
window.initFloatingWindow = function() {
try {
createStyle();
const elements = createElements();
initFunctions(elements);
console.log('东方淮竹悬浮窗（功能按钮版）初始化完成');
} catch (err) {
console.error('悬浮窗初始化失败：', err);
alert('悬浮窗加载异常，请刷新页面重试');
// 初始化失败时清理残留元素
window.destroyFloatingWindow?.();
}
};

// 对外暴露销毁函数（保留原逻辑，清理所有元素/样式）
window.destroyFloatingWindow = function() {
const floatBtn = document.getElementById('floatBtn');
const floatWindow = document.getElementById('floatWindow');
if (floatBtn) floatBtn.remove();
if (floatWindow) floatWindow.remove();
if (styleElement) styleElement.remove();
if (pollTimer) clearInterval(pollTimer); // 兼容原逻辑，避免内存泄漏
window.floatingWindowInjected = false;
};
})();
