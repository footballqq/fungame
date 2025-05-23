/**
 * @function showCustomAlert
 * @description 显示自定义的居中alert对话框
 * @param {string} message - 要显示的消息
 */
function showCustomAlert(message) {
    // 创建对话框元素
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
    
    // 添加消息
    const messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.style.marginBottom = '20px';
    
    // 添加确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确定';
    confirmButton.style.padding = '8px 16px';
    confirmButton.style.backgroundColor = '#4CAF50';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.borderRadius = '4px';
    confirmButton.style.cursor = 'pointer';
    
    // 添加背景遮罩
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    overlay.style.zIndex = '999';
    
    // 点击确认按钮关闭对话框
    confirmButton.addEventListener('click', function() {
        document.body.removeChild(dialog);
        document.body.removeChild(overlay);
    });
    
    // 组装对话框
    dialog.appendChild(messageElement);
    dialog.appendChild(confirmButton);
    
    // 添加到页面
    document.body.appendChild(overlay);
    document.body.appendChild(dialog);
    
    // 聚焦确认按钮
    confirmButton.focus();
}

/**
 * @function showCustomPrompt
 * @description 显示自定义的居中prompt对话框
 * @param {string} message - 提示消息
 * @param {string} defaultValue - 默认值
 * @returns {Promise} 返回用户输入的值或null
 */
function showCustomPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
        // 创建对话框元素
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
        
        // 添加消息
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.marginBottom = '15px';
        
        // 添加输入框
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.value = defaultValue;
        inputElement.style.width = '100%';
        inputElement.style.padding = '8px';
        inputElement.style.marginBottom = '15px';
        inputElement.style.boxSizing = 'border-box';
        inputElement.style.border = '1px solid #ccc';
        inputElement.style.borderRadius = '4px';
        
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
        
        // 点击确认按钮
        confirmButton.addEventListener('click', function() {
            const value = inputElement.value;
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve(value);
        });
        
        // 点击取消按钮
        cancelButton.addEventListener('click', function() {
            document.body.removeChild(dialog);
            document.body.removeChild(overlay);
            resolve(null);
        });
        
        // 组装对话框
        dialog.appendChild(messageElement);
        dialog.appendChild(inputElement);
        buttonContainer.appendChild(confirmButton);
        buttonContainer.appendChild(cancelButton);
        dialog.appendChild(buttonContainer);
        
        // 添加到页面
        document.body.appendChild(overlay);
        document.body.appendChild(dialog);
        
        // 聚焦输入框
        inputElement.focus();
    });
}