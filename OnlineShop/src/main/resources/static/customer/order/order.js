document.addEventListener('DOMContentLoaded', () => {
    getUserInfo();
    displayOrderItems().then(() => {
        updateTotalPayment();
    });
});

function displayOrderItems() {
    const selectedItems = JSON.parse(localStorage.getItem('selectedItemsForOrder')) || [];
    const orderTableBody = document.getElementById('order-items');
    const orderTotalElement = document.getElementById('order-total');
    let totalOrderPrice = 0;

    if (selectedItems.length === 0) {
        orderTableBody.innerHTML = '<tr><td colspan="5">Không có sản phẩm nào được chọn để đặt hàng.</td></tr>';
        if (orderTotalElement) orderTotalElement.textContent = 'đ0';
        return Promise.resolve();
    }

    orderTableBody.innerHTML = '';
    selectedItems.forEach(item => {
        totalOrderPrice += item.totalPrice || 0; // Đảm bảo totalPrice không undefined
        const row = document.createElement('tr');
        row.innerHTML = `
            <td data-label="Hình Ảnh"><img src="${item.imageUrl}" alt="${item.productName}" onerror="this.onerror=null; this.src='https://d1hjkbq40fs2x4.cloudfront.net/2016-01-31/files/1045.jpg';"></td>
            <td data-label="Tên Sản Phẩm">${item.productName}</td>
            <td data-label="Giá">đ${item.price.toLocaleString('vi-VN')}</td>
            <td data-label="Số Lượng">${item.quantity}</td>
            <td data-label="Tổng Tiền" style="color: red">đ${(item.totalPrice || 0).toLocaleString('vi-VN')}</td>
        `;
        orderTableBody.appendChild(row);
    });

    if (orderTotalElement) orderTotalElement.textContent = `đ${totalOrderPrice.toLocaleString('vi-VN')}`;
    return Promise.resolve();
}

async function getUserInfo() {
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
        alert('Vui lòng đăng nhập để xem thông tin!');
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        const response = await fetch('http://localhost:8080/api/auth/user/info', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const userInfo = await response.json();
            if (userInfo && typeof userInfo === 'object' && userInfo.fullName && userInfo.phoneNumber && userInfo.address) {
                document.getElementById('user-full-name').textContent = userInfo.fullName;
                document.getElementById('user-phone-number').textContent = userInfo.phoneNumber;
                document.getElementById('user-address').textContent = userInfo.address;
            } else {
                alert('Dữ liệu từ API không chứa đầy đủ thông tin (fullName, phoneNumber, address).');
                document.getElementById('user-full-name').textContent = 'Chưa có thông tin';
                document.getElementById('user-phone-number').textContent = 'Chưa có thông tin';
                document.getElementById('user-address').textContent = 'Chưa có thông tin';
            }
        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/auth/login.html';
            } else {
                alert(`Lỗi khi lấy thông tin người dùng: ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Fetch Error:', error.message);
        alert('Lỗi kết nối đến server. Vui lòng thử lại sau!');
    }
}

async function confirmOrder() {
    const selectedItems = JSON.parse(localStorage.getItem('selectedItemsForOrder')) || [];
    if (selectedItems.length === 0) {
        alert('Không có sản phẩm nào để đặt hàng!');
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để đặt hàng!');
        window.location.href = '/auth/login.html';
        return;
    }

    const orderData = {
        items: selectedItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }))
    };

    try {
        const response = await fetch('http://localhost:8080/api/orders/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        });

        if (response.ok) {
            alert('Đặt hàng thành công!');
            localStorage.removeItem('selectedItemsForOrder');
            window.location.href = '/customer/order/order-list.html';
        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/auth/login.html';
            } else {
                alert(`Lỗi khi đặt hàng: ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert('Lỗi kết nối. Vui lòng thử lại sau!');
    }
}

function handleOrderConfirmation() {
    if (confirm('Bạn có chắc chắn muốn đặt hàng không?')) {
        confirmOrder();
    }
}

function updateTotalPayment() {
    const orderTotalText = document.getElementById('order-total').textContent.replace('đ', '').replace(/\./g, '');
    const orderTotal = parseInt(orderTotalText) || 0;
    const shippingFee = 10000;
    const totalPayment = orderTotal + shippingFee;
    document.getElementById('shipping-fee').textContent = `đ${shippingFee.toLocaleString('vi-VN')}`;
    document.getElementById('total-payment').textContent = `đ${totalPayment.toLocaleString('vi-VN')}`;
}