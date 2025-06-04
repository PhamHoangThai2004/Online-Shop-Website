document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded in order.js, starting initialization');
    getUserInfo();
    displayOrderItems().then(() => {
        updateTotalPayment();
    });
});

function displayOrderItems() {
    console.log('Displaying order items');
    const selectedItems = JSON.parse(localStorage.getItem('selectedItemsForOrder')) || [];
    console.log('Selected Items:', selectedItems); // Kiểm tra dữ liệu
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
        console.log('Item:', item); // Kiểm tra từng item
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

    console.log('Total Order Price:', totalOrderPrice); // Kiểm tra tổng
    if (orderTotalElement) orderTotalElement.textContent = `đ${totalOrderPrice.toLocaleString('vi-VN')}`;
    return Promise.resolve();
}

async function getUserInfo() {
    console.log('Fetching user info started in order.js');
    const token = localStorage.getItem('token');
    console.log('Token from localStorage:', token);
    if (!token || token.trim() === '') {
        console.error('No valid token found in localStorage');
        alert('Vui lòng đăng nhập để xem thông tin!');
        window.location.href = '/customer/login/login.html';
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

        console.log('API Response Status:', response.status);
        if (response.ok) {
            const userInfo = await response.json();
            console.log('User Info Received:', userInfo);
            if (userInfo && typeof userInfo === 'object' && userInfo.fullName && userInfo.phoneNumber && userInfo.address) {
                document.getElementById('user-full-name').textContent = userInfo.fullName;
                document.getElementById('user-phone-number').textContent = userInfo.phoneNumber;
                document.getElementById('user-address').textContent = userInfo.address;
            } else {
                console.error('Invalid user info structure:', userInfo);
                alert('Dữ liệu từ API không chứa đầy đủ thông tin (fullName, phoneNumber, address).');
                document.getElementById('user-full-name').textContent = 'Chưa có thông tin';
                document.getElementById('user-phone-number').textContent = 'Chưa có thông tin';
                document.getElementById('user-address').textContent = 'Chưa có thông tin';
            }
        } else {
            const errorText = await response.text();
            console.error('API Error - Status:', response.status, 'Message:', errorText);
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/customer/login/login.html';
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
        window.location.href = '/customer/login/login.html';
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
            window.location.href = '/customer/home/home.html';
        } else {
            const errorText = await response.text();
            if (response.status === 401) {
                alert('Token không hợp lệ hoặc hết hạn. Vui lòng đăng nhập lại!');
                window.location.href = '/customer/login/login.html';
            } else {
                alert(`Lỗi khi đặt hàng: ${errorText}`);
            }
        }
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        alert('Lỗi kết nối. Vui lòng thử lại sau!');
    }
}

// Hàm kiểm tra xác nhận trước khi đặt hàng
function handleOrderConfirmation() {
    if (confirm('Bạn có chắc chắn muốn đặt hàng không?')) {
        confirmOrder();
    }
}

function updateTotalPayment() {
    const orderTotalText = document.getElementById('order-total').textContent.replace('đ', '').replace(/\./g, '');
    console.log('Order Total Text:', orderTotalText); // Kiểm tra chuỗi trước khi parse
    const orderTotal = parseInt(orderTotalText) || 0;
    console.log('Order Total Parsed:', orderTotal); // Kiểm tra giá trị sau khi parse
    const shippingFee = 10000; // Phí vận chuyển cố định 10.000
    const totalPayment = orderTotal + shippingFee;
    document.getElementById('shipping-fee').textContent = `đ${shippingFee.toLocaleString('vi-VN')}`;
    document.getElementById('total-payment').textContent = `đ${totalPayment.toLocaleString('vi-VN')}`;
}