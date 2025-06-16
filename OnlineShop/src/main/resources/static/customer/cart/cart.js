document.addEventListener('DOMContentLoaded', () => {
    fetchCartItems();
    document.getElementById('select-all').addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll('#cart-items input[type="checkbox"]');
        checkboxes.forEach(checkbox => checkbox.checked = e.target.checked);
        updateTotal();
        updateDeleteAllButton();
    });

    document.querySelector('.buy-now-btn').addEventListener('click', proceedToOrder);
});

async function fetchCartItems() {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Vui lòng đăng nhập để xem giỏ hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        const serverCheck = await fetch('http://localhost:8080/api/cart/user', {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }).catch(() => null);

        if (!serverCheck) {
            throw new Error('Không thể kết nối đến server. Vui lòng kiểm tra server Spring Boot.');
        }

        const response = await fetch('http://localhost:8080/api/cart/user', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const cartData = await response.json();
            const cartItems = Array.isArray(cartData.items) ? cartData.items : (cartData.cart?.items || []);
            displayCartItems(cartItems);
        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = 'auth/login.html';
            } else if (response.status === 404) {
                alert('Không tìm thấy giỏ hàng cho người dùng này.');
            } else {
                alert(`Lỗi khi lấy giỏ hàng: ${response.status} - ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Lỗi chi tiết khi lấy giỏ hàng:', error);
        alert(`Lỗi kết nối: ${error.message}. Vui lòng kiểm tra server, mạng, hoặc CORS!`);
    }
}

async function fetchProductImage(productId) {
    const defaultImage = 'https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';
    try {
        const response = await fetch(`http://localhost:8080/api/images/product/${productId}`);
        if (response.ok) {
            const imageData = await response.json();
            return imageData.url || defaultImage;
        } else {
            console.warn(`Không tìm thấy ảnh cho sản phẩm ${productId}. Sử dụng ảnh mặc định.`);
            return defaultImage;
        }
    } catch (error) {
        console.error(`Lỗi khi lấy ảnh cho sản phẩm ${productId}:`, error);
        return defaultImage;
    }
}

async function displayCartItems(cartItems) {
    const cartTableBody = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    if (!cartItems || cartItems.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="7">Giỏ hàng của bạn đang trống.</td></tr>';
        cartTotalElement.textContent = 'đ0';
        document.getElementById('selected-count').textContent = '0';
        updateDeleteAllButton();
        updateSelectAllCheckbox();
        return;
    }

    cartTableBody.innerHTML = '';
    for (const item of cartItems) {
        const priceToUse = item.productSalePrice !== null && item.productSalePrice !== undefined ? item.productSalePrice : item.productPrice;
        const quantity = item.quantity !== null && item.quantity !== undefined ? item.quantity : 1;
        let totalPrice = priceToUse * quantity;

        if (isNaN(totalPrice) || totalPrice < 0) {
            console.warn(`totalPrice không hợp lệ cho ${item.productName}, gán mặc định 0`);
            totalPrice = 0;
        }

        const imageUrl = await fetchProductImage(item.productId);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label=""><input type="checkbox" class="item-checkbox" data-price="${totalPrice}" data-product-id="${item.productId}"></td>
            <td data-label="Hình Ảnh"><img src="${imageUrl}" alt="${item.productName}" onerror="this.onerror=null; this.src='https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';"></td>
            <td data-label="Tên Sản Phẩm">${item.productName}</td>
            <td data-label="Giá">đ${priceToUse.toLocaleString('vi-VN')}</td>
            <td data-label="Số Lượng">
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="1" readonly>
                    <button class="quantity-btn" onclick="updateQuantity(${item.productId}, ${quantity + 1})">+</button>
                </div>
            </td>
            <td data-label="Tổng Tiền" style="color: red">đ${totalPrice.toLocaleString('vi-VN')}</td>
            <td data-label="Thao Tác">
                <button class="delete-btn" onclick="if(confirm('Bạn có chắc chắn muốn xóa sản phẩm ${item.productName} khỏi giỏ hàng không?')) removeFromCart(${item.productId})"><i class="fa fa-trash"></i></button>
            </td>
        `;
        cartTableBody.appendChild(row);

        const checkbox = row.querySelector('.item-checkbox');
    }

    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateTotal();
            updateDeleteAllButton();
            updateSelectAllCheckbox();
        });
    });

    updateTotal();
    updateDeleteAllButton();
    updateSelectAllCheckbox();
}

function updateTotal() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const cartTotalElement = document.getElementById('cart-total');
    const selectedCountElement = document.getElementById('selected-count');
    let totalCartPrice = 0;

    checkboxes.forEach(checkbox => {
        const price = parseFloat(checkbox.getAttribute('data-price'));
        if (!isNaN(price)) {
            totalCartPrice += price;
        } else {
            console.warn(`Giá trị data-price không hợp lệ: ${checkbox.getAttribute('data-price')}`);
        }
    });

    cartTotalElement.textContent = `đ${totalCartPrice.toLocaleString('vi-VN')}`;
    selectedCountElement.textContent = checkboxes.length;
}

function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const itemCheckboxes = document.querySelectorAll('.item-checkbox');

    if (itemCheckboxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
        return;
    }

    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');

    if (checkedBoxes.length === 0) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    } else if (checkedBoxes.length === itemCheckboxes.length) {
        selectAllCheckbox.checked = true;
        selectAllCheckbox.indeterminate = false;
    } else {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = true;
    }
}

function updateDeleteAllButton() {
    const deleteAllBtn = document.querySelector('.delete-all-btn');
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');

    if (deleteAllBtn) {
        deleteAllBtn.disabled = checkedBoxes.length === 0;
    }
}

async function deleteAllSelected() {
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');

    if (checkedBoxes.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để xóa!');
        return;
    }

    const productIds = Array.from(checkedBoxes).map(checkbox =>
        parseInt(checkbox.getAttribute('data-product-id'))
    );

    const confirmMessage = `Bạn có chắc chắn muốn xóa ${productIds.length} sản phẩm đã chọn khỏi giỏ hàng không?`;

    if (!confirm(confirmMessage)) {
        return;
    }

    const token = localStorage.getItem('token');
    let successCount = 0;
    let errorCount = 0;

    const deleteAllBtn = document.querySelector('.delete-all-btn');
    deleteAllBtn.disabled = true;
    deleteAllBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Đang xóa...';

    try {
        for (const productId of productIds) {
            try {
                const response = await fetch(`http://localhost:8080/api/cart/remove?productId=${productId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    console.error(`Lỗi khi xóa sản phẩm ${productId}:`, response.status);
                }
            } catch (error) {
                errorCount++;
                console.error(`Lỗi kết nối khi xóa sản phẩm ${productId}:`, error);
            }
        }

        if (successCount > 0) {
            alert(`Đã xóa thành công ${successCount} sản phẩm!${errorCount > 0 ? ` (${errorCount} sản phẩm lỗi)` : ''}`);
            await fetchCartItems();
            document.getElementById('select-all').checked = false;
            document.getElementById('selected-count').textContent = '0';
        } else {
            alert('Không thể xóa sản phẩm nào. Vui lòng thử lại!');
        }

    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        alert('Có lỗi xảy ra khi xóa sản phẩm. Vui lòng thử lại!');
    } finally {
        deleteAllBtn.innerHTML = '<i class="fa fa-trash"></i> Xóa tất cả';
        updateDeleteAllButton();
    }
}

async function updateQuantity(productId, newQuantity) {
    if (newQuantity < 1) {
        if (confirm('Số lượng nhỏ hơn 1 sẽ xóa sản phẩm khỏi giỏ hàng. Bạn có chắc không?')) {
            removeFromCart(productId);
        }
        return;
    }

    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:8080/api/cart/update?productId=${productId}&quantity=${newQuantity}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            fetchCartItems();
        } else {
            let errorMessage = 'Lỗi khi cập nhật số lượng.';
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!';
                window.location.href = 'auth/login.html';
            } else if (response.status === 400) {
                errorMessage = 'Số lượng không hợp lệ hoặc vượt quá tồn kho.';
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.log('Lỗi kết nối khi cập nhật số lượng:', error);
        alert('Lỗi kết nối. Vui lòng thử lại sau!');
    }
}

async function removeFromCart(productId) {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch(`http://localhost:8080/api/cart/remove?productId=${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            fetchCartItems();
        } else {
            let errorMessage = 'Lỗi khi xóa sản phẩm.';
            if (response.status === 401) {
                errorMessage = 'Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!';
                window.location.href = '/auth/login.html';
            }
            alert(errorMessage);
        }
    } catch (error) {
        console.log('Lỗi kết nối khi xóa sản phẩm:', error);
        alert('Lỗi kết nối. Vui lòng thử lại sau!');
    }
}

function proceedToOrder() {
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');

    if (checkedBoxes.length === 0) {
        alert('Vui lòng chọn ít nhất một sản phẩm để đặt hàng!');
        return;
    }

    const selectedItems = Array.from(checkedBoxes).map(checkbox => {
        const row = checkbox.closest('tr');
        const productId = parseInt(checkbox.getAttribute('data-product-id'));
        const productName = row.querySelector('td[data-label="Tên Sản Phẩm"]').textContent;
        const priceText = row.querySelector('td[data-label="Giá"]').textContent.replace('đ', '').replace(/\./g, '');
        const price = parseFloat(priceText);
        const quantityText = row.querySelector('.quantity-input').value;
        const quantity = parseInt(quantityText);
        const totalPriceText = row.querySelector('td[data-label="Tổng Tiền"]').textContent.replace('đ', '').replace(/\./g, '');
        const totalPrice = parseFloat(totalPriceText);
        const imageUrl = row.querySelector('td[data-label="Hình Ảnh"] img').src;

        return {
            productId,
            productName,
            price,
            quantity,
            totalPrice,
            imageUrl
        };
    });

    localStorage.setItem('selectedItemsForOrder', JSON.stringify(selectedItems));
    window.location.href = '/customer/order/order.html';
}

// function proceedToCheckout() {
//     window.location.href = '/customer/checkout/checkout.html';
// }