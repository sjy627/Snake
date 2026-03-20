// ==================== 游戏状态变量 ====================
let game_status         // 进程ID
let status = "off"      // 开始/暂停
let game_over_val = 0   // 游戏状态 1：进行中  0：gameover

// ==================== 方向控制变量 ====================
let direction           // 当前移动方向
let nextDirection       // 目标方向（按键防抖：记录下一次移动方向）

// ==================== 蛇身坐标变量 ====================
let coordinate_X
let coordinate_Y
let temp_X, temp_Y      // 蛇身构造坐标(交换用)

// ==================== 食物变量 ====================
let food_coordinate = []   // 食物坐标数组
let foodNode               // 食物节点

// ==================== 速度控制变量 ====================
let baseTime            // 基础时间间隔（由难度选择决定）
let currentTime         // 当前实际时间间隔
let speedBoostActive = false  // Shift加速状态
let speedMultiplier = 1       // 当前速度倍率（食物加速累积）

// ==================== 分数变量 ====================
let currentScore = 0    // 当前分数
let highScore = 0       // 历史最高分
const HIGH_SCORE_KEY = 'snake_high_score'  // localStorage键名

// ==================== 初始化：读取历史最高分 ====================
function initHighScore() {
    const saved = localStorage.getItem(HIGH_SCORE_KEY)
    if (saved !== null) {
        highScore = parseInt(saved, 10) || 0
    }
    updateScoreDisplay()
}

// ==================== 更新分数显示 ====================
function updateScoreDisplay() {
    const currentScoreEl = document.getElementById('currentScore')
    const highScoreEl = document.getElementById('highScore')
    if (currentScoreEl) currentScoreEl.textContent = currentScore
    if (highScoreEl) highScoreEl.textContent = highScore
}

// ==================== 更新历史最高分 ====================
function updateHighScore() {
    if (currentScore > highScore) {
        highScore = currentScore
        localStorage.setItem(HIGH_SCORE_KEY, highScore.toString())
        updateScoreDisplay()
    }
}

// ==================== 计算当前移动间隔 ====================
function calculateInterval() {
    // 基础间隔 × 食物加速倍率 × Shift加速倍率
    let interval = baseTime / speedMultiplier
    if (speedBoostActive) {
        interval = interval / 1.5  // Shift加速50%
    }
    return Math.max(interval, 30)  // 最小间隔30ms，防止过快
}

// ==================== 重新设置游戏定时器 ====================
function resetGameInterval() {
    if (game_status) {
        clearInterval(game_status)
        currentTime = calculateInterval()
        game_status = setInterval(move_direction, currentTime)
    }
}

// ==================== 方向判断函数：检查是否可以转向 ====================
function canChangeDirection(current, next) {
    // 禁止直接反向：上↔下、左↔右 不能互转
    const opposites = {
        'up': 'down',
        'down': 'up',
        'before': 'after',
        'after': 'before'
    }
    return opposites[current] !== next
}

// ==================== 键盘事件监听 ====================
addEventListener("keydown", (e) => {
    // Shift键按下：加速
    if (e.keyCode === 16) {
        if (!speedBoostActive && game_over_val === 1) {
            speedBoostActive = true
            resetGameInterval()
        }
        return
    }

    // 空格键：暂停/继续
    if (e.keyCode === 32) {
        game_mode()
        return
    }

    // 游戏进行中才处理方向键
    if (game_over_val !== 1) return

    let newDirection = null

    // 左方向键
    if (e.keyCode === 37) {
        newDirection = "after"
    }
    // 上方向键
    else if (e.keyCode === 38) {
        newDirection = "up"
    }
    // 右方向键
    else if (e.keyCode === 39) {
        newDirection = "before"
    }
    // 下方向键
    else if (e.keyCode === 40) {
        newDirection = "down"
    }

    // 如果按下了有效方向键
    if (newDirection) {
        // 检查是否允许转向（不能反向）
        if (canChangeDirection(direction, newDirection)) {
            nextDirection = newDirection  // 记录目标方向，等待下一次移动时应用
            updateDirectionDisplay()
        }
    }
})

// ==================== Shift键释放：恢复正常速度 ====================
addEventListener("keyup", (e) => {
    if (e.keyCode === 16) {
        if (speedBoostActive) {
            speedBoostActive = false
            resetGameInterval()
        }
    }
})

// ==================== 更新方向显示 ====================
function updateDirectionDisplay() {
    const dirMap = {
        'up': '\u2191',
        'down': '\u2193',
        'before': '\u2192',
        'after': '\u2190'
    }
    if (status === "on") {
        dir.children[1].textContent = dirMap[nextDirection] || dirMap[direction]
    }
}

// ==================== 执行游戏状态（暂停/继续） ====================
function game_mode() {
    if (status === "off") {
        Start_game.style.visibility = "hidden"
        map.style.visibility = "visible"
        status = "on"
        if (game_over_val === 0) {
            init()  // 初始化
            game_over_val = 1
        }
        if (!foodNode) append_food()  // 投放食物
        currentTime = calculateInterval()
        game_status = setInterval(move_direction, currentTime)  // 开始游戏
    } else {
        Start_game.style.visibility = "visible"
        map.style.visibility = "hidden"
        status = "off"
        Start_game.children[0].textContent = "游戏暂停中"
        Start_game.children[0].dataset.text = "..."
        clearInterval(game_status)  // 暂停游戏
    }
}

// ==================== 游戏初始化 ====================
function init() {
    // 重置分数
    currentScore = 0
    updateScoreDisplay()

    // 重置速度
    speedMultiplier = 1

    // 读取难度设置
    baseTime = diff.children[1].value - 0

    // 重置方向
    direction = "before"
    nextDirection = "before"

    // UI更新
    score.children[1].textContent = "0"
    dir.children[1].textContent = "\u2192"

    // 初始化蛇的位置（头部在左侧中间）
    coordinate_X = [320]  // snak的X坐标数组[0] snak_head坐标
    coordinate_Y = [320]  // snak的Y坐标数组[0] snak_head坐标
    Snak_head.style.left = coordinate_X[0] + "px"
    Snak_head.style.top = coordinate_Y[0] + "px"

    // 清除旧蛇身
    let node = map.children
    for (let i = node.length - 1; i >= 0; i--) {
        if (node[i].className === "Snak_body") map.removeChild(node[i])
    }
}

// ==================== 移动及碰撞检测 ====================
function move_direction() {
    // 在移动前应用目标方向（按键防抖核心逻辑）
    if (nextDirection && canChangeDirection(direction, nextDirection)) {
        direction = nextDirection
    }

    let last_body_X = coordinate_X[coordinate_X.length - 1]
    let last_body_Y = coordinate_Y[coordinate_Y.length - 1]
    temp_X = coordinate_X[0]
    temp_Y = coordinate_Y[0]

    // 根据方向移动蛇头
    if (direction === "up" && coordinate_Y[0] - 20 >= 0) {
        Snak_head.style.top = coordinate_Y[0] - 20 + "px"
        coordinate_Y[0] -= 20
    } else if (direction === "down" && coordinate_Y[0] + 20 <= 640) {
        Snak_head.style.top = coordinate_Y[0] + 20 + "px"
        coordinate_Y[0] += 20
    } else if (direction === "before" && coordinate_X[0] + 20 <= 640) {
        Snak_head.style.left = coordinate_X[0] + 20 + "px"
        coordinate_X[0] += 20
    } else if (direction === "after" && coordinate_X[0] - 20 >= 0) {
        Snak_head.style.left = coordinate_X[0] - 20 + "px"
        coordinate_X[0] -= 20
    } else {
        game_over()
        return
    }

    // 吃到食物检测
    if (coordinate_X[0] === food_coordinate[0] && coordinate_Y[0] === food_coordinate[1]) {
        // 增加分数
        currentScore++
        score.children[1].textContent = currentScore
        updateScoreDisplay()

        // 食物加速：每次+5%
        speedMultiplier = speedMultiplier * 1.05
        resetGameInterval()

        // 清除食物坐标
        food_coordinate = []

        // 添加蛇身
        let Snak_body = document.createElement("div")
        Snak_body.className = "Snak_body"
        Snak_body.style.left = last_body_X + "px"
        Snak_body.style.top = last_body_Y + "px"
        map.appendChild(Snak_body)
        coordinate_X.push(last_body_X)
        coordinate_Y.push(last_body_Y)

        // 移除旧食物并生成新食物
        map.removeChild(foodNode)
        append_food()
    }

    // 重构蛇身
    snake()

    // 碰撞检测
    if (!game_over_judge()) {
        game_over()
    }
}

// ==================== 添加食物 ====================
function append_food() {
    foodNode = document.createElement("span")
    foodNode.className = "food_span"
    let count = 0, val
    while (count != 2) {
        val = parseInt(Math.round(Math.random() * 1000) / 20) * 20
        if (val > 640) continue
        if (coordinate_X.indexOf(val) === -1) {
            if (count === 0) {
                foodNode.style.left = val + "px"
            } else {
                foodNode.style.top = val + "px"
            }
            food_coordinate.push(val)
            count++
        }
    }
    map.appendChild(foodNode)
}

// ==================== 重构蛇身 ====================
function snake() {
    let snak = map.getElementsByTagName("div")
    for (let i = snak.length - 1; i >= 1; i--) {
        if (i === 1) {
            snak[1].style.left = temp_X + "px"
            snak[1].style.top = temp_Y + "px"
            coordinate_X[1] = temp_X
            coordinate_Y[1] = temp_Y
            break
        }
        snak[i].style.left = coordinate_X[i - 1] + "px"
        snak[i].style.top = coordinate_Y[i - 1] + "px"
        coordinate_X[i] = coordinate_X[i - 1]
        coordinate_Y[i] = coordinate_Y[i - 1]
    }
}

// ==================== 游戏结束判断（撞到自己） ====================
function game_over_judge() {
    let judge_X = coordinate_X.slice(1), judge_Y = coordinate_Y.slice(1)
    for (let i = 0; i < judge_X.length; i++) {
        if (judge_X[i] === coordinate_X[0]) {
            if (judge_Y[i] === coordinate_Y[0]) return false
        }
    }
    return true
}

// ==================== 游戏结束处理 ====================
function game_over() {
    // 更新历史最高分
    updateHighScore()

    Start_game.style.visibility = "visible"
    map.style.visibility = "hidden"
    status = "off"
    game_over_val = 0
    speedBoostActive = false
    Start_game.children[0].textContent = "Game over ！！！"
    Start_game.children[0].dataset.text = ""
    clearInterval(game_status)
}

// ==================== 页面加载时初始化历史最高分 ====================
window.addEventListener('load', initHighScore)
