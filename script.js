// 算法配置
const CONFIG = {
    baseValues: {
        male: -100,
        female: 100,
        intersexMale: -80,
        intersexFemale: 80,
        neutral: 0
    },
    traits: [
        { id: 'attack', name: '攻击性气质', value: 25, stereotype: true },
        { id: 'dominance', name: '支配性', value: 35, stereotype: true },
        { id: 'badBoy', name: '坏男人刻板', value: 15, stereotype: true },
        { id: 'tough', name: '强势', value: 20, stereotype: true },
        { id: 'protective', name: '保护欲', value: 10, stereotype: false },
        { id: 'gentle', name: '温柔', value: -15, stereotype: false },
        { id: 'submissive', name: '顺从性', value: -25, stereotype: true },
        { id: 'soft', name: '柔弱气质', value: -20, stereotype: true },
        { id: 'feminine', name: '男性双性气质', value: -30, stereotype: true },
        { id: 'cute', name: '可爱', value: -18, stereotype: false },
        { id: 'intelligent', name: '高智商', value: 5, stereotype: false },
        { id: 'mysterious', name: '神秘感', value: 8, stereotype: false },
        { id: 'rebellious', name: '叛逆', value: 12, stereotype: false },
        { id: 'traditional', name: '传统', value: -5, stereotype: true },
        { id: 'androgynous', name: '中性气质', value: -10, stereotype: false }
    ],
    momoCorrection: {
        base: -50,
        multiplier: 1.0
    }
};

// 状态管理
const State = {
    characters: [],
    selectedTraits: new Set(),
    currentCharacterId: null
};

// DOM元素
const DOM = {
    charName: document.getElementById('charName'),
    physiology: document.getElementById('physiology'),
    socialGender: document.getElementById('socialGender'),
    traitsContainer: document.getElementById('traitsContainer'),
    momoCorrection: document.getElementById('momoCorrection'),
    momoStrength: document.getElementById('momoStrength'),
    strengthValue: document.getElementById('strengthValue'),
    saveChar: document.getElementById('saveChar'),
    resetChar: document.getElementById('resetChar'),
    characterList: document.getElementById('characterList'),
    charA: document.getElementById('charA'),
    charB: document.getElementById('charB'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    resultsContainer: document.getElementById('resultsContainer'),
    
    // 算法参数
    baseMale: document.getElementById('baseMale'),
    baseFemale: document.getElementById('baseFemale'),
    intersexMale: document.getElementById('intersexMale'),
    intersexFemale: document.getElementById('intersexFemale')
};

// 初始化
function init() {
    renderTraits();
    setupEventListeners();
    loadCharactersFromStorage();
    updateCharacterDropdowns();
}

// 渲染特征选择器
function renderTraits() {
    DOM.traitsContainer.innerHTML = '';
    
    CONFIG.traits.forEach(trait => {
        const traitEl = document.createElement('div');
        traitEl.className = 'trait-option';
        traitEl.innerHTML = `
            <input type="checkbox" id="trait-${trait.id}" value="${trait.id}">
            <label for="trait-${trait.id}">${trait.name}</label>
            <span class="trait-value ${trait.value > 0 ? 'positive' : 'negative'}">
                ${trait.value > 0 ? '+' : ''}${trait.value}
            </span>
        `;
        
        const checkbox = traitEl.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                State.selectedTraits.add(trait.id);
            } else {
                State.selectedTraits.delete(trait.id);
            }
        });
        
        DOM.traitsContainer.appendChild(traitEl);
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 嬷化强度滑块
    DOM.momoStrength.addEventListener('input', (e) => {
        DOM.strengthValue.textContent = e.target.value;
        CONFIG.momoCorrection.multiplier = e.target.value / 5;
    });
    
    // 保存角色
    DOM.saveChar.addEventListener('click', saveCharacter);
    
    // 重置表单
    DOM.resetChar.addEventListener('click', resetForm);
    
    // 分析按钮
    DOM.analyzeBtn.addEventListener('click', analyzeCharacters);
    
    // 算法参数变化
    [DOM.baseMale, DOM.baseFemale, DOM.intersexMale, DOM.intersexFemale].forEach(input => {
        input.addEventListener('change', updateConfigFromUI);
    });
}

// 从UI更新配置
function updateConfigFromUI() {
    CONFIG.baseValues.male = parseInt(DOM.baseMale.value);
    CONFIG.baseValues.female = parseInt(DOM.baseFemale.value);
    CONFIG.baseValues.intersexMale = parseInt(DOM.intersexMale.value);
    CONFIG.baseValues.intersexFemale = parseInt(DOM.intersexFemale.value);
}

// 计算角色的相对性别值
function calculateCharacterValue(character) {
    let total = 0;
    const breakdown = [];
    
    // 1. 基础性别赋值
    let baseValue = 0;
    if (character.physiology === 'male') {
        baseValue = CONFIG.baseValues.male;
    } else if (character.physiology === 'female') {
        baseValue = CONFIG.baseValues.female;
    } else if (character.physiology === 'intersex') {
        if (character.socialGender === 'male') {
            baseValue = CONFIG.baseValues.intersexMale;
        } else if (character.socialGender === 'female') {
            baseValue = CONFIG.baseValues.intersexFemale;
        } else {
            baseValue = CONFIG.baseValues.neutral;
        }
    } else {
        baseValue = CONFIG.baseValues.neutral;
    }
    
    total += baseValue;
    breakdown.push({ name: '基础性别值', value: baseValue });
    
    // 2. 特征调整
    let traitTotal = 0;
    let stereotypeTraitCount = 0;
    
    character.traits.forEach(traitId => {
        const trait = CONFIG.traits.find(t => t.id === traitId);
        if (trait) {
            traitTotal += trait.value;
            if (trait.stereotype) stereotypeTraitCount++;
            breakdown.push({ name: trait.name, value: trait.value });
        }
    });
    
    total += traitTotal;
    breakdown.push({ name: '特征总值', value: traitTotal });
    
    // 3. 嬷化修正
    if (character.momoCorrection && stereotypeTraitCount > 0) {
        const momoValue = CONFIG.momoCorrection.base * CONFIG.momoCorrection.multiplier;
        total += momoValue;
        breakdown.push({ 
            name: `嬷化修正 (强度: ${CONFIG.momoCorrection.multiplier.toFixed(1)})`, 
            value: momoValue 
        });
    }
    
    return {
        total: Math.round(total * 10) / 10, // 保留一位小数
        breakdown,
        stereotypeTraitCount
    };
}

// 保存角色
function saveCharacter() {
    const name = DOM.charName.value.trim();
    if (!name) {
        alert('请输入角色名称');
        return;
    }
    
    const character = {
        id: State.currentCharacterId || Date.now().toString(),
        name,
        physiology: DOM.physiology.value,
        socialGender: DOM.socialGender.value,
        traits: Array.from(State.selectedTraits),
        momoCorrection: DOM.momoCorrection.checked,
        momoStrength: parseInt(DOM.momoStrength.value),
        createdAt: new Date().toISOString()
    };
    
    // 计算值
    const result = calculateCharacterValue(character);
    character.value = result.total;
    character.breakdown = result.breakdown;
    
    // 更新或添加
    const existingIndex = State.characters.findIndex(c => c.id === character.id);
    if (existingIndex >= 0) {
        State.characters[existingIndex] = character;
    } else {
        State.characters.push(character);
    }
    
    // 保存到本地存储
    saveCharactersToStorage();
    
    // 更新UI
    renderCharacterList();
    updateCharacterDropdowns();
    resetForm();
    
    alert('角色保存成功！');
}

// 重置表单
function resetForm() {
    DOM.charName.value = '';
    DOM.physiology.value = 'male';
    DOM.socialGender.value = 'male';
    DOM.momoCorrection.checked = false;
    DOM.momoStrength.value = 5;
    DOM.strengthValue.textContent = '5';
    
    // 清除选中的特征
    State.selectedTraits.clear();
    document.querySelectorAll('.trait-option input').forEach(checkbox => {
        checkbox.checked = false;
    });
    
    State.currentCharacterId = null;
}

// 渲染角色列表
function renderCharacterList() {
    DOM.characterList.innerHTML = '';
    
    if (State.characters.length === 0) {
        DOM.characterList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <p>暂无角色，请先创建角色</p>
            </div>
        `;
        return;
    }
    
    State.characters.forEach(character => {
        const genderClass = character.physiology === 'male' ? 'gender-male' : 
                           character.physiology === 'female' ? 'gender-female' : 'gender-intersex';
        
        const genderText = character.physiology === 'male' ? '男性' : 
                          character.physiology === 'female' ? '女性' : 
                          character.socialGender === 'male' ? '双性(男)' : '双性(女)';
        
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-header">
                <div class="char-name">${character.name}</div>
                <div class="char-gender ${genderClass}">${genderText}</div>
            </div>
            
            <div class="char-traits">
                ${character.traits.slice(0, 4).map(traitId => {
                    const trait = CONFIG.traits.find(t => t.id === traitId);
                    return trait ? `<span class="trait-tag">${trait.name}</span>` : '';
                }).join('')}
                ${character.traits.length > 4 ? `<span class="trait-tag">+${character.traits.length - 4}</span>` : ''}
            </div>
            
            <div class="char-value">
                <div class="value-label">相对性别值:</div>
                <div class="value-number ${character.value >= 0 ? 'positive' : 'negative'}">
                    ${character.value >= 0 ? '+' : ''}${character.value}
                </div>
            </div>
            
            <div class="card-actions">
                <button class="btn card-btn edit-btn" data-id="${character.id}">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn card-btn delete-btn" data-id="${character.id}">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </div>
        `;
        
        DOM.characterList.appendChild(card);
    });
    
    // 添加编辑和删除事件
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('button').dataset.id;
            editCharacter(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.target.closest('button').dataset.id;
            deleteCharacter(id);
        });
    });
}

// 编辑角色
function editCharacter(id) {
    const character = State.characters.find(c => c.id === id);
    if (!character) return;
    
    DOM.charName.value = character.name;
    DOM.physiology.value = character.physiology;
    DOM.socialGender.value = character.socialGender;
    DOM.momoCorrection.checked = character.momoCorrection;
    DOM.momoStrength.value = character.momoStrength;
    DOM.strengthValue.textContent = character.momoStrength;
    
    // 设置选中的特征
    State.selectedTraits = new Set(character.traits);
    document.querySelectorAll('.trait-option input').forEach(checkbox => {
        checkbox.checked = State.selectedTraits.has(checkbox.value);
    });
    
    State.currentCharacterId = character.id;
    
    // 滚动到表单
    document.querySelector('.character-form').scrollIntoView({ behavior: 'smooth' });
}

// 删除角色
function deleteCharacter(id) {
    if (!confirm('确定要删除这个角色吗？')) return;
    
    State.characters = State.characters.filter(c => c.id !== id);
    saveCharactersToStorage();
    renderCharacterList();
    updateCharacterDropdowns();
}

// 更新角色下拉菜单
function updateCharacterDropdowns() {
    DOM.charA.innerHTML = '<option value="">选择角色...</option>';
    DOM.charB.innerHTML = '<option value="">选择角色...</option>';
    
    State.characters.forEach(character => {
        const optionA = document.createElement('option');
        optionA.value = character.id;
        optionA.textContent = `${character.name} (${character.value >= 0 ? '+' : ''}${character.value})`;
        DOM.charA.appendChild(optionA);
        
        const optionB = document.createElement('option');
        optionB.value = character.id;
        optionB.textContent = `${character.name} (${character.value >= 0 ? '+' : ''}${character.value})`;
        DOM.charB.appendChild(optionB);
    });
}

// 分析两个角色
function analyzeCharacters() {
    const charAId = DOM.charA.value;
    const charBId = DOM.charB.value;
    
    if (!charAId || !charBId) {
        alert('请选择两个角色进行比较');
        return;
    }
    
    if (charAId === charBId) {
        alert('请选择两个不同的角色');
        return;
    }
    
    const charA = State.characters.find(c => c.id === charAId);
    const charB = State.characters.find(c => c.id === charBId);
    
    if (!charA || !charB) {
        alert('角色数据错误，请重新选择');
        return;
    }
    
    // 重新计算值（确保使用最新配置）
    const resultA = calculateCharacterValue(charA);
    const resultB = calculateCharacterValue(charB);
    
    charA.value = resultA.total;
    charA.breakdown = resultA.breakdown;
    
    charB.value = resultB.total;
    charB.breakdown = resultB.breakdown;
    
    // 确定左右位
    const leftChar = charA.value > charB.value ? charA : charB;
    const rightChar = charA.value > charB.value ? charB : charA;
    
    // 渲染结果
    renderResults(leftChar, rightChar);
}

// 渲染分析结果
function renderResults(leftChar, rightChar) {
    const diff = Math.abs(leftChar.value - rightChar.value);
    
    let compatibility = '';
    if (diff < 20) {
        compatibility = '势均力敌，配对充满悬念';
    } else if (diff < 50) {
        compatibility = '有明确倾向，但存在反转可能';
    } else if (diff < 100) {
        compatibility = '倾向明显，符合主流预期';
    } else {
        compatibility = '绝对压制，经典配对模式';
    }
    
    DOM.resultsContainer.innerHTML = `
        <div class="result-card">
            <div class="result-header">
                <div class="result-title">配对分析结果</div>
                <div class="result-score">差值: ${diff.toFixed(1)}</div>
            </div>
            
            <div class="characters-comparison">
                <div class="char-result left">
                    <div class="result-role role-left">左位 (攻)</div>
                    <h3>${leftChar.name}</h3>
                    <div class="char-value">
                        <div class="value-label">相对性别值:</div>
                        <div class="value-number positive">${leftChar.value >= 0 ? '+' : ''}${leftChar.value}</div>
                    </div>
                    <div class="char-traits">
                        ${leftChar.traits.slice(0, 5).map(traitId => {
                            const trait = CONFIG.traits.find(t => t.id === traitId);
                            return trait ? `<span class="trait-tag">${trait.name}</span>` : '';
                        }).join('')}
                    </div>
                </div>
                
                <div class="vs-icon">
                    <i class="fas fa-arrows-alt-h"></i>
                </div>
                
                <div class="char-result right">
                    <div class="result-role role-right">右位 (受)</div>
                    <h3>${rightChar.name}</h3>
                    <div class="char-value">
                        <div class="value-label">相对性别值:</div>
                        <div class="value-number ${rightChar.value >= 0 ? 'positive' : 'negative'}">
                            ${rightChar.value >= 0 ? '+' : ''}${rightChar.value}
                        </div>
                    </div>
                    <div class="char-traits">
                        ${rightChar.traits.slice(0, 5).map(traitId => {
                            const trait = CONFIG.traits.find(t => t.id === traitId);
                            return trait ? `<span class="trait-tag">${trait.name}</span>` : '';
                        }).join('')}
                    </div>
                </div>
            </div>
            
            <div class="compatibility">
                <h4><i class="fas fa-heart"></i> 配对分析: ${compatibility}</h4>
                <p>根据相对性别值计算，${leftChar.name} (${leftChar.value >= 0 ? '+' : ''}${leftChar.value}) 
                大于 ${rightChar.name} (${rightChar.value >= 0 ? '+' : ''}${rightChar.value})，
                因此 ${leftChar.name} 被判定为左位，${rightChar.name} 被判定为右位。</p>
            </div>
            
            <div class="breakdown">
                <h4><i class="fas fa-list-ol"></i> ${leftChar.name} 数值构成:</h4>
                ${leftChar.breakdown.map(item => `
                    <div class="breakdown-item">
                        <span>${item.name}</span>
                        <span class="${item.value >= 0 ? 'positive' : 'negative'}">
                            ${item.value >= 0 ? '+' : ''}${item.value}
                        </span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    
    // 滚动到结果区域
    DOM.resultsContainer.scrollIntoView({ behavior: 'smooth' });
}

// 本地存储相关
function saveCharactersToStorage() {
    try {
        localStorage.setItem('mommo-characters', JSON.stringify(State.characters));
    } catch (e) {
        console.error('保存角色数据失败:', e);
    }
}

function loadCharactersFromStorage() {
    try {
        const saved = localStorage.getItem('mommo-characters');
        if (saved) {
            State.characters = JSON.parse(saved);
            renderCharacterList();
        }
    } catch (e) {
        console.error('加载角色数据失败:', e);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);