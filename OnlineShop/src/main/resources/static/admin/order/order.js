const API_BASE_URL = 'http://localhost:8080/api/orders';
const orderTableBody = document.getElementById('orderTableBody');

async function fetchAndRenderOrders() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để xem danh sách đơn hàng');
            return;
        }

        const response = await fetch(API_BASE_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy danh sách đơn hàng: ${await response.text()}`);
        }

        const orders = await response.json();
        renderOrders(orders);
    } catch (error) {
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function renderOrders(orders) {
    orderTableBody.innerHTML = '';
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.id}</td>
            <td>${order.userId}</td>
            <td>${order.totalPrice.toLocaleString('vi-VN')} VNĐ</td>
            <td>${order.status}</td>
            <td>${new Date(order.createdAt).toLocaleString('vi-VN')}</td>
            <td>
                <button onclick="editOrderStatus(${order.id})">Chỉnh sửa trạng thái</button>
            </td>
        `;
        orderTableBody.appendChild(row);
    });
}

function editOrderStatus(orderId) {
    window.location.href = `order-detail.html?id=${orderId}`;
}

document.addEventListener('DOMContentLoaded', fetchAndRenderOrders);