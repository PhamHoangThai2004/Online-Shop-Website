const API_BASE_URL = 'http://localhost:8080/api/orders';
const updateOrderForm = document.getElementById('updateOrderForm');
const orderIdElement = document.getElementById('orderId');
const orderDateElement = document.getElementById('orderDate');
const totalPriceElement = document.getElementById('totalPrice');
const currentStatusElement = document.getElementById('currentStatus');
const orderItemsTableBody = document.getElementById('orderItemsTableBody');

async function fetchAndPopulateOrder() {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');

    if (!orderId) {
        alert('Không tìm thấy ID đơn hàng');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Vui lòng đăng nhập để chỉnh sửa đơn hàng');
            return;
        }

        const response = await fetch(`${API_BASE_URL}/${orderId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể lấy chi tiết đơn hàng: ${await response.text()}`);
        }

        const order = await response.json();
        orderIdElement.textContent = order.id;
        orderDateElement.textContent = new Date(order.createdAt).toLocaleString('vi-VN');
        totalPriceElement.textContent = order.totalPrice.toLocaleString('vi-VN');
        currentStatusElement.textContent = order.status;
        document.getElementById('id').value = order.id;
        document.getElementById('status').value = order.status;

        renderOrderItems(order.items);
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`Đã có lỗi xảy ra: ${error.message}`);
    }
}

function renderOrderItems(items) {
    orderItemsTableBody.innerHTML = '';
    items.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.productName}</td>
            <td>${item.price.toLocaleString('vi-VN')} VNĐ</td>
            <td>${item.quantity}</td>
            <td>${(item.price * item.quantity).toLocaleString('vi-VN')} VNĐ</td>
        `;
        orderItemsTableBody.appendChild(row);
    });
}

async function updateOrderStatus(event) {
    event.preventDefault();

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Vui lòng đăng nhập để cập nhật trạng thái đơn hàng');
        return;
    }

    const orderId = document.getElementById('id').value;
    const status = document.getElementById('status').value;

    try {
        const response = await fetch(`${API_BASE_URL}/${orderId}/status?status=${status}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Không thể cập nhật trạng thái: ${await response.text()}`);
        }

        alert('Cập nhật trạng thái thành công');
        window.location.href = 'order.html';
    } catch (error) {
        console.error('Lỗi:', error);
        alert(`${error.message}`);
    }
}

// Gắn sự kiện cho form cập nhật
updateOrderForm.addEventListener('submit', updateOrderStatus);

// Tải thông tin đơn hàng khi trang được tải
document.addEventListener('DOMContentLoaded', fetchAndPopulateOrder);