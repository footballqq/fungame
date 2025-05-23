/**
 * @function createCakeElement
 * @description Creates an HTML element for a single cake.
 * @param {object} cake - The cake object.
 * @returns {HTMLElement} The created cake div element.
 */
function createCakeElement(cake) {
    const cakeDiv = document.createElement('div');
    cakeDiv.classList.add('cake');
    cakeDiv.dataset.cakeId = cake.id;
    cakeDiv.draggable = cake.location === 'pending' || cake.location === 'baking'; // Make draggable if not completed

    const sideAStatus = cake.isSideACooked ? '熟' : `生(${cake.sideA_cookedTime}/${cake.sideA_targetTime})`;
    const sideBStatus = cake.isSideBCooked ? '熟' : `生(${cake.sideB_cookedTime}/${cake.sideB_targetTime})`;

    cakeDiv.innerHTML = `
        <span>饼 #${cake.id}</span>
        <span class="side-status side-a ${cake.isSideACooked ? 'cooked' : 'raw'}">A面: ${sideAStatus}</span>
        <span class="side-status side-b ${cake.isSideBCooked ? 'cooked' : 'raw'}">B面: ${sideBStatus}</span>
    `;

    if (cake.location === 'pending') {
        cakeDiv.onclick = () => handlePendingCakeClick(cake.id);
    }
    if (cake.location === 'baking') {
        cakeDiv.onclick = () => handleBakingCakeClick(cake.id);
    }

    return cakeDiv;
}

/**
 * @function handlePendingCakeClick
 * @description 处理点击未完成区饼的事件，使用单选按钮选择要烙的面
 * @param {number} cakeId - 被点击饼的ID
 */
async function handlePendingCakeClick(cakeId) {
    if (!gameRunning || gameEnded) {
        showCustomAlert('游戏未开始或已结束！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake || cake.isFullyCooked) return;

    const targetPanSlotIndex = pan[0] === null ? 0 : (pan[1] === null ? 1 : -1);
    if (targetPanSlotIndex === -1) {
        showCustomAlert('烙饼区已满！');
        return;
    }
    
    // 创建单选按钮对话框
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.padding = '20px';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    dialog.style.zIndex = '1000';
    dialog.style.minWidth = '300px';
    dialog.style.textAlign = 'center';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = `将饼 #${cakeId} 放入烙饼区，烙哪一面？`;
    title.style.marginBottom = '15px';
    
    // 创建单选按钮组
    const radioGroup = document.createElement('div');
    radioGroup.style.display = 'flex';
    radioGroup.style.justifyContent = 'center';
    radioGroup.style.gap = '20px';
    radioGroup.style.marginBottom = '20px';
    
    // A面单选按钮
    const radioA = document.createElement('div');
    radioA.style.display = 'flex';
    radioA.style.alignItems = 'center';
    
    const inputA = document.createElement('input');
    inputA.type = 'radio';
    inputA.id = 'sideA';
    inputA.name = 'side';
    inputA.value = 'A';
    inputA.checked = !cake.isSideACooked; // 默认选中A面，除非已烙熟
    inputA.disabled = cake.isSideACooked; // 如果A面已烙熟，禁用选项
    
    const labelA = document.createElement('label');
    labelA.htmlFor = 'sideA';
    labelA.textContent = cake.isSideACooked ? 'A面 (已熟)' : 'A面';
    labelA.style.marginLeft = '5px';
    if (cake.isSideACooked) {
        labelA.style.color = '#999';
    }
    
    radioA.appendChild(inputA);
    radioA.appendChild(labelA);
    
    // B面单选按钮
    const radioB = document.createElement('div');
    radioB.style.display = 'flex';
    radioB.style.alignItems = 'center';
    
    const inputB = document.createElement('input');
    inputB.type = 'radio';
    inputB.id = 'sideB';
    inputB.name = 'side';
    inputB.value = 'B';
    inputB.checked = cake.isSideACooked && !cake.isSideBCooked; // 如果A面已熟但B面未熟，默认选B
    inputB.disabled = cake.isSideBCooked; // 如果B面已烙熟，禁用选项
    
    const labelB = document.createElement('label');
    labelB.htmlFor = 'sideB';
    labelB.textContent = cake.isSideBCooked ? 'B面 (已熟)' : 'B面';
    labelB.style.marginLeft = '5px';
    if (cake.isSideBCooked) {
        labelB.style.color = '#999';
    }
    
    radioB.appendChild(inputB);
    radioB.appendChild(labelB);
    
    // 添加单选按钮到组
    radioGroup.appendChild(radioA);
    radioGroup.appendChild(radioB);
    
    // 检查是否两面都已烙熟
    if (cake.isSideACooked && cake.isSideBCooked) {
        showCustomAlert(`饼 #${cakeId} 两面都已烙熟！`);
        return;
    }
    
    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    // 添加确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.flex = '1';
    confirmButton.style.marginRight = '10px';
    
    // 添加取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.flex = '1';
    
    // 添加背景遮罩
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';
    
    // 返回选择的面
    return new Promise((resolve) => {
        // 点击确认按钮
        confirmButton.addEventListener('click', function() {
            const selectedSide = document.querySelector('input[name="side"]:checked');
            if (selectedSide) {
                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
                moveCakeToPan(cake, targetPanSlotIndex, selectedSide.value);
                resolve();
            } else {
                showCustomAlert('请选择要烙的面。');
            }
        });
        
        // 点击取消按钮
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve();
        });
        
        // 组装对话框
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(title);
        dialog.appendChild(radioGroup);
        dialog.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
    });
}

/**
 * @function handleBakingCakeClick
 * @description 处理点击烙饼区饼的事件，使用单选按钮选择操作
 * @param {number} cakeId - 被点击饼的ID
 */
async function handleBakingCakeClick(cakeId) {
    if (!gameRunning || gameEnded) {
        showCustomAlert('游戏未开始或已结束！');
        return;
    }
    const cake = cakes.find(c => c.id === cakeId);
    if (!cake) return;

    // 创建单选按钮对话框
    const dialog = document.createElement('div');
    dialog.style.position = 'fixed';
    dialog.style.top = '50%';
    dialog.style.left = '50%';
    dialog.style.transform = 'translate(-50%, -50%)';
    dialog.style.padding = '20px';
    dialog.style.backgroundColor = 'white';
    dialog.style.border = '1px solid #ccc';
    dialog.style.borderRadius = '5px';
    dialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    dialog.style.zIndex = '1000';
    dialog.style.minWidth = '300px';
    dialog.style.textAlign = 'center';
    
    // 添加标题
    const title = document.createElement('h3');
    title.textContent = `操作饼 #${cakeId}：`;
    title.style.marginBottom = '15px';
    
    // 创建单选按钮组
    const radioGroup = document.createElement('div');
    radioGroup.style.display = 'flex';
    radioGroup.style.flexDirection = 'column';
    radioGroup.style.alignItems = 'flex-start';
    radioGroup.style.gap = '10px';
    radioGroup.style.marginBottom = '20px';
    radioGroup.style.padding = '0 20px';
    
    // 翻面选项
    const radioFlip = document.createElement('div');
    radioFlip.style.display = 'flex';
    radioFlip.style.alignItems = 'center';
    
    const inputFlip = document.createElement('input');
    inputFlip.type = 'radio';
    inputFlip.id = 'actionFlip';
    inputFlip.name = 'action';
    inputFlip.value = '1';
    inputFlip.checked = true; // 默认选中翻面
    
    // 检查另一面是否已烙熟
    const otherSide = cake.currentBakingSide === 'A' ? 'B' : 'A';
    const isOtherSideCooked = otherSide === 'A' ? cake.isSideACooked : cake.isSideBCooked;
    
    // 如果另一面已烙熟，禁用翻面选项
    inputFlip.disabled = isOtherSideCooked;
    
    const labelFlip = document.createElement('label');
    labelFlip.htmlFor = 'actionFlip';
    labelFlip.textContent = isOtherSideCooked ? 
        `翻面 (${otherSide}面已熟)` : 
        `翻面 (烙${otherSide}面)`;
    labelFlip.style.marginLeft = '5px';
    
    if (isOtherSideCooked) {
        labelFlip.style.color = '#999';
    }
    
    radioFlip.appendChild(inputFlip);
    radioFlip.appendChild(labelFlip);
    
    // 移回选项
    const radioMove = document.createElement('div');
    radioMove.style.display = 'flex';
    radioMove.style.alignItems = 'center';
    
    const inputMove = document.createElement('input');
    inputMove.type = 'radio';
    inputMove.id = 'actionMove';
    inputMove.name = 'action';
    inputMove.value = '2';
    inputMove.checked = isOtherSideCooked; // 如果另一面已熟，默认选中移回
    
    const labelMove = document.createElement('label');
    labelMove.htmlFor = 'actionMove';
    labelMove.textContent = '移回未完成区';
    labelMove.style.marginLeft = '5px';
    
    radioMove.appendChild(inputMove);
    radioMove.appendChild(labelMove);
    
    // 添加单选按钮到组
    radioGroup.appendChild(radioFlip);
    radioGroup.appendChild(radioMove);
    
    // 添加按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'space-between';
    
    // 添加确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.flex = '1';
    confirmButton.style.marginRight = '10px';
    
    // 添加取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = '取消';
    cancelButton.style.padding = '8px 16px';
    cancelButton.style.backgroundColor = '#f44336';
    cancelButton.style.color = 'white';
    cancelButton.style.border = 'none';
    cancelButton.style.borderRadius = '4px';
    cancelButton.style.cursor = 'pointer';
    cancelButton.style.flex = '1';
    
    // 添加背景遮罩
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';
    
    // 返回选择的操作
    return new Promise((resolve) => {
        // 点击确认按钮
        confirmButton.addEventListener('click', function() {
            const selectedAction = document.querySelector('input[name="action"]:checked');
            if (selectedAction) {
                document.body.removeChild(dialog);
                document.body.removeChild(overlay);
                
                if (selectedAction.value === '1') {
                    flipCakeInPan(cake);
                } else if (selectedAction.value === '2') {
                    moveCakeFromPanToPending(cake);
                }
                
                resolve();
            } else {
                showCustomAlert('请选择一个操作。');
            }
        });
        
        // 点击取消按钮
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve();
        });
        
        // 组装对话框
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(title);
        dialog.appendChild(radioGroup);
        dialog.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
    });
}